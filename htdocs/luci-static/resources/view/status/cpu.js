'use strict';
'require dom';
'require fs';
'require poll';
'require request';
'require view';
'require ui';

document.head.append(E('style', {'type': 'text/css'},
`
:root {
	--app-cpu-status-total: gray;
	--app-cpu-status-user: blue;
	--app-cpu-status-sys: red;
	--app-cpu-status-sirq: green;
}
.svg_background {
	width: 100%;
	height: 300px;
	border: 1px solid #000;
	background: #fff';
}
[data-darkmode="true"] .svg_background {
	background-color: var(--background-color-high) !important;
}
.graph_legend {
	border-bottom: 2px solid;
}
.total {
	border-color: var(--app-cpu-status-total);
}
.user{
	border-color: var(--app-cpu-status-user);
}
.sys {
	border-color: var(--app-cpu-status-sys);
}
.sirq {
	border-color: var(--app-cpu-status-sirq);
}
svg line.grid {
	stroke: black;
	stroke-width: 0.1;
}
[data-darkmode="true"] svg line.grid {
	stroke: #fff !important;
}
svg text {
	fill: #eee;
	font-size: 9pt;
	font-family: sans-serif;
	text-shadow: 1px 1px 1px #000;
}
svg #total_line {
	fill: var(--app-cpu-status-total);
	fill-opacity: 0.4;
	stroke: var(--app-cpu-status-total);
	stroke-width: 1;
}
svg #user_line {
	fill: var(--app-cpu-status-user);
	fill-opacity: 0.5;
	stroke: var(--app-cpu-status-user);
	stroke-width: 1;
}
svg #sys_line {
	fill: var(--app-cpu-status-sys);
	fill-opacity: 0.5;
	stroke: var(--app-cpu-status-sys);
	stroke-width: 1;
}
svg #sirq_line {
	fill: var(--app-cpu-status-sirq);
	fill-opacity: 0.5;
	stroke: var(--app-cpu-status-sirq);
	stroke-width: 1;
}
`));

Math.log2 = Math.log2 || (x => Math.log(x) * Math.LOG2E);

return view.extend({
	pollInterval  : 3,

	dataBufferSize: 4,

	CPUDevices    : {},

	graphPolls    : [],

	lastStatArray : null,

	parseProcData(data) {
		let cpu_stat_array   = [];
		let stat_items_array = data.trim().split('\n').filter(s => s.startsWith('cpu'));

		for(let str of stat_items_array) {
			let arr = str.split(/\s+/).slice(0, 8);
			arr[0]  = (arr[0] === 'cpu') ? -1 : arr[0].replace('cpu', '');
			cpu_stat_array.push(arr.map(e => Number(e)));
		};

		cpu_stat_array.sort((a, b) => a[0] - b[0]);
		return cpu_stat_array;
	},

	calcCPULoad(cpu_stat_array) {
		let ret_array = [];
		cpu_stat_array.forEach((c, i) => {
			let loadUser = 0,
			    loadNice = 0,
			    loadSys  = 0,
			    loadIdle = 0,
			    loadIo   = 0,
			    loadIrq  = 0,
			    loadSirq = 0,
			    loadAvg  = 0;
			if(this.lastStatArray !== null && this.lastStatArray.cpuNum === c.cpuNum) {
				let user = c[1] - this.lastStatArray[i][1],
				    nice = c[2] - this.lastStatArray[i][2],
				    sys  = c[3] - this.lastStatArray[i][3],
				    idle = c[4] - this.lastStatArray[i][4],
				    io   = c[5] - this.lastStatArray[i][5],
				    irq  = c[6] - this.lastStatArray[i][6],
				    sirq = c[7] - this.lastStatArray[i][7];
				let sum  = user + nice + sys + idle + io + irq + sirq;
				loadUser = Number((100 * user / sum).toFixed(1));
				loadNice = Number((100 * nice / sum).toFixed(1));
				loadSys  = Number((100 * sys / sum).toFixed(1));
				loadIdle = Number((100 * idle / sum).toFixed(1));
				loadIo   = Number((100 * io / sum).toFixed(1));
				loadIrq  = Number((100 * irq / sum).toFixed(1));
				loadSirq = Number((100 * sirq / sum).toFixed(1));
				loadAvg  = Math.round(100 * (user + nice + sys + io + irq + sirq) / sum);
			};
			ret_array.push(
				{cpuNum: c[0], loadUser, loadNice, loadSys, loadIdle, loadIo, loadIrq, loadSirq, loadAvg});
		});
		this.lastStatArray = cpu_stat_array;
		return ret_array;
	},

	getCPUData(cpu_data) {
		return L.resolveDefault(fs.read('/proc/stat'), null).then(cpu_data => {
			if(cpu_data) {
				let cpu_stat_array = this.parseProcData(cpu_data);

				// For single-core CPU
				if(cpu_stat_array.length === 2) {
					cpu_stat_array = cpu_stat_array.slice(0, 1);
				};

				let cpu_load_array = this.calcCPULoad(cpu_stat_array);

				for(let i = 0; i < cpu_load_array.length; i++) {
					let num   = i;
					let total = cpu_load_array[i].loadAvg;
					let user  = cpu_load_array[i].loadUser;
					let sys   = cpu_load_array[i].loadSys;
					let sirq  = cpu_load_array[i].loadSirq;

					if(!(num in this.CPUDevices)) {
						this.CPUDevices[num] = {
							num : i,
							name: String(cpu_load_array[i].cpuNum),
							load: [],
						};
					};

					let load_array = this.CPUDevices[num].load;
					load_array.push([
						new Date().getTime(),
						total || 0,
						user  || 0,
						sys   || 0,
						sirq  || 0,
					]);
					if(load_array.length > this.dataBufferSize) {
						load_array.shift();
					};
				};

			};
			return this.CPUDevices;
		});
	},

	loadSVG(src) {
		return request.get(src).then(response => {
			if(!response.ok) {
				throw new Error(response.statusText);
			};

			return E('div', {
				'class': 'svg_background',
			}, E(response.text()));
		});
	},

	updateGraph(cpu_num, svg, peak, lines, cb) {
		let G                 = svg.firstElementChild;
		let view              = document.querySelector('#view');
		let width             = view.offsetWidth - 2;
		let height            = 300 - 2;
		let base_step         = 5;
		let time_interval     = 60;
		let time_interval_min = time_interval / 60
		let step              = base_step * this.pollInterval;
		let data_wanted       = Math.ceil(width / step);
		let timeline_offset   = width % step;
		let data_values       = [];
		let line_elements     = [];

		for(let i = 0; i < lines.length; i++) {
			if(lines[i] != null) {
				data_values.push([]);
			};
		};

		let info = {
			line_current: [],
			line_average: [],
			line_peak   : [],
		};

		/* prefill datasets */
		for(let i = 0; i < data_values.length; i++) {
			for(let j = 0; j < data_wanted; j++) {
				data_values[i][j] = NaN;
			};
		};

		/* plot horizontal time interval lines */
		for(let i = width % (base_step * time_interval); i < width; i += base_step * time_interval) {
			let x    = i - (timeline_offset);
			let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', x);
				line.setAttribute('y1', 0);
				line.setAttribute('x2', x);
				line.setAttribute('y2', '100%');
				line.setAttribute('class', 'grid');

			let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				text.setAttribute('x', x + 5);
				text.setAttribute('y', 15);
				text.append(document.createTextNode(String((width - i) / base_step / time_interval) + 'm'));

			G.append(line);
			G.append(text);
		};

		info.interval  = this.pollInterval;
		info.timeframe = Math.floor(data_wanted / time_interval * this.pollInterval);

		this.graphPolls.push({
			cpu_num,
			svg,
			peak,
			lines,
			cb,
			info,
			width,
			height,
			step,
			data_wanted,
			values     : data_values,
			timestamp  : 0,
			fill       : 1,
		});
	},

	pollData() {
		poll.add(L.bind(function() {
			return this.getCPUData().then(L.bind(function(datasets) {

				for(let gi = 0; gi < this.graphPolls.length; gi++) {
					let ctx = this.graphPolls[gi];

					if(!datasets[ctx.cpu_num]) {
						continue;
					};

					let data = datasets[ctx.cpu_num].load;

					if(!data) {
						continue;
					};

					let values         = ctx.values;
					let lines          = ctx.lines;
					let info           = ctx.info;
					let peak           = ctx.peak;
					let data_scale     = 0;
					let data_wanted    = ctx.data_wanted;
					let last_timestamp = NaN;

					for(let i = 0, di = 0; di < lines.length; di++) {
						if(lines[di] == null) {
							continue;
						};

						for(let j = ctx.timestamp ? 0 : 1; j < data.length; j++) {

							/* skip overlapping and empty entries */
							if(data[j][0] <= ctx.timestamp) {
								continue;
							};

							if(i == 0) {
								ctx.fill++;
								last_timestamp = data[j][0];
							};

							info.line_current[i] = data[j][di + 1];
							values[i].push(info.line_current[i]);
						};

						i++;
					};

					/* cut off outdated entries */
					ctx.fill = Math.min(ctx.fill, data_wanted);

					for(let i = 0; i < values.length; i++) {
						let len = values[i].length;
						values[i] = values[i].slice(len - data_wanted, len);

						/* find peaks, averages */
						info.line_peak[i]    = NaN;
						info.line_average[i] = 0;

						let nonempty = 0;
						for(let j = 0; j < values[i].length; j++) {
							info.line_peak[i] = isNaN(info.line_peak[i]) ? values[i][j] : Math.max(info.line_peak[i], values[i][j]);
							info.line_peak[i] = Number(info.line_peak[i].toFixed(1));

							if(!isNaN(values[i][j])) {
								nonempty++;
								info.line_average[i] += values[i][j];
							};
						};

						info.line_average[i] = info.line_average[i] / nonempty;
						info.line_average[i] = Number(info.line_average[i].toFixed(1));
					};

					/* remember current timestamp, calculate horizontal scale */
					if(!isNaN(last_timestamp)) {
						ctx.timestamp = last_timestamp;
					};

					let size   = Math.floor(Math.log2(info.peak));
					let div    = Math.pow(2, size - (size % 10));
					data_scale = ctx.height / peak;

					/* plot data */
					for(let i = 0, di = 0; di < lines.length; di++) {
						if(lines[di] == null) {
							continue;
						};

						let el = ctx.svg.firstElementChild.getElementById(lines[di].line);
						let pt = '0,' + ctx.height;
						let y  = 0;

						if(!el) {
							continue;
						};

						for(let j = 0; j < values[i].length; j++) {
							let x = j * ctx.step;

							y  = ctx.height - Math.floor(values[i][j] * data_scale);
							//y -= Math.floor(y % (1 / data_scale));
							y  = isNaN(y) ? ctx.height + 1 : y;
							pt += ` ${x},${y}`;
						};

						pt += ` ${ctx.width},${y} ${ctx.width},${ctx.height}`;
						el.setAttribute('points', pt);

						i++;
					};

					info.label_25 = 0.25 * peak;
					info.label_50 = 0.50 * peak;
					info.label_75 = 0.75 * peak;

					if(typeof(ctx.cb) == 'function') {
						ctx.cb(ctx.svg, info);
					};
				};
			}, this));
		}, this), this.pollInterval);
	},

	load() {
		return Promise.all([
			this.loadSVG(L.resource('svg/cpu.svg')),
			this.getCPUData(),
		]);
	},

	render(data) {
		let svg  = data[0];
		let cpus = data[1];
		let map  = E('div', { 'class': 'cbi-map', 'id': 'map' });
		let tabs = E('div');
		map.append(tabs);

		for(let i of Object.values(cpus)) {
			let cpu_num  = i.num;
			let cpu_name = (Number(i.name) >= 0 ) ? `${_('CPU')} ${i.name}` : _('Total');
			let csvg     = svg.cloneNode(true);

			tabs.append(E('div', { 'class': 'cbi-section', 'data-tab': cpu_num, 'data-tab-title': cpu_name }, [
				csvg,
				E('div', { 'class': 'right' }, E('small', { 'data-graph': 'scale' }, '-')),
				E('br'),
				E('table', { 'class': 'table', 'style': 'width:100%;table-layout:fixed' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td right top' }, E('strong', { 'class': 'graph_legend total' }, _('Total') + ':')),
						E('td', { 'class': 'td', 'data-graph': 'total_cur' }, '-'),
						E('td', { 'class': 'td right top' }, E('strong', {}, _('Average:'))),
						E('td', { 'class': 'td', 'data-graph': 'total_avg' }, '-'),

						E('td', { 'class': 'td right top' }, E('strong', {}, _('Peak:'))),
						E('td', { 'class': 'td', 'data-graph': 'total_peak' }, '-'),
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td right top' }, E('strong', { 'class': 'graph_legend user' }, 'User' + ':')),
						E('td', { 'class': 'td', 'data-graph': 'user_cur' }, '-'),
						E('td', { 'class': 'td right top' }, E('strong', {}, _('Average:'))),
						E('td', { 'class': 'td', 'data-graph': 'user_avg' }, '-'),

						E('td', { 'class': 'td right top' }, E('strong', {}, _('Peak:'))),
						E('td', { 'class': 'td', 'data-graph': 'user_peak' }, '-'),
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td right top' }, E('strong', { 'class': 'graph_legend sys' }, 'System' + ':')),
						E('td', { 'class': 'td', 'data-graph': 'sys_cur' }, '-'),
						E('td', { 'class': 'td right top' }, E('strong', {}, _('Average:'))),
						E('td', { 'class': 'td', 'data-graph': 'sys_avg' }, '-'),

						E('td', { 'class': 'td right top' }, E('strong', {}, _('Peak:'))),
						E('td', { 'class': 'td', 'data-graph': 'sys_peak' }, '-'),
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td right top' }, E('strong', { 'class': 'graph_legend sirq' }, 'Sirq' + ':')),
						E('td', { 'class': 'td', 'data-graph': 'sirq_cur' }, '-'),
						E('td', { 'class': 'td right top' }, E('strong', {}, _('Average:'))),
						E('td', { 'class': 'td', 'data-graph': 'sirq_avg' }, '-'),

						E('td', { 'class': 'td right top' }, E('strong', {}, _('Peak:'))),
						E('td', { 'class': 'td', 'data-graph': 'sirq_peak' }, '-'),
					]),

				]),
				E('br'),
			]));

			this.updateGraph(
				cpu_num,
				csvg,
				100,
				[ { 'line': 'total_line' }, { 'line': 'user_line' }, { 'line': 'sys_line' }, { 'line': 'sirq_line' } ],
				(svg, info) => {
					let G = svg.firstElementChild, tab = svg.parentNode;

					G.getElementById('label_25').firstChild.data = '%d %%'.format(info.label_25);
					G.getElementById('label_50').firstChild.data = '%d %%'.format(info.label_50);
					G.getElementById('label_75').firstChild.data = '%d %%'.format(info.label_75);

					tab.querySelector('[data-graph="scale"]').firstChild.data = _('(%d minute window, %d second interval)').format(info.timeframe, info.interval);

					dom.content(tab.querySelector('[data-graph="total_cur"]'), info.line_current[0] + ' %');
					dom.content(tab.querySelector('[data-graph="total_avg"]'), info.line_average[0] + ' %');
					dom.content(tab.querySelector('[data-graph="total_peak"]'), info.line_peak[0] + ' %');

					dom.content(tab.querySelector('[data-graph="user_cur"]'), info.line_current[1] + ' %');
					dom.content(tab.querySelector('[data-graph="user_avg"]'), info.line_average[1] + ' %');
					dom.content(tab.querySelector('[data-graph="user_peak"]'), info.line_peak[1] + ' %');

					dom.content(tab.querySelector('[data-graph="sys_cur"]'), info.line_current[2] + ' %');
					dom.content(tab.querySelector('[data-graph="sys_avg"]'), info.line_average[2] + ' %');
					dom.content(tab.querySelector('[data-graph="sys_peak"]'), info.line_peak[2] + ' %');

					dom.content(tab.querySelector('[data-graph="sirq_cur"]'), info.line_current[3] + ' %');
					dom.content(tab.querySelector('[data-graph="sirq_avg"]'), info.line_average[3] + ' %');
					dom.content(tab.querySelector('[data-graph="sirq_peak"]'), info.line_peak[3] + ' %');
				}
			);
		};

		ui.tabs.initTabGroup(tabs.childNodes);
		this.pollData();

		return  E([], [
			E('h2', _('CPU load')),
			E('div', {'class': 'cbi-map-descr'},
			  _('This page displays the average CPU load at %d second interval.').format(this.pollInterval)),
			map,
		]);
	},

	handleSaveApply: null,
	handleSave     : null,
	handleReset    : null,
});
