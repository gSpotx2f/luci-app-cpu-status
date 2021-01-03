'use strict';
'require fs';

return L.Class.extend({
	title: _('CPU'),

	deviceRegExp: new RegExp('^cpu[0-9]+$'),

	sortFunc: function(a, b) {
		return a[0] - b[0];
	},

	load: async function() {
		if(!('cpuStatusDevices' in window)) {
			await fs.list('/sys/devices/system/cpu').then(stat => {
				let devices = [];

				for(let file of stat) {
					let fname = file.name;
					if(this.deviceRegExp.test(fname)) {
						devices.push(
							[Number(fname.replace('cpu', '')), '/sys/devices/system/cpu/' + fname]);
					};
				};

				devices.sort(this.sortFunc);
				window.cpuStatusDevices = devices;
			}).catch(e => {
				window.cpuStatusDevices = [];
			});
		};

		let promises = [];
		promises.push(L.resolveDefault(fs.read('/proc/stat'), null));

		for(let cpu of window.cpuStatusDevices) {
			promises.push(
				L.resolveDefault(fs.read(cpu[1] + '/cpufreq/cpuinfo_cur_freq'), null))
		};

		return Promise.all(promises).catch(e => {});
	},

	render: function(cpuData) {
		if(!cpuData || !cpuData[0]) return;

		let cpuStatArray = [];
		let statStringsArray = cpuData[0].trim().split('\n').filter(s => s.startsWith('cpu'));

		for(let str of statStringsArray) {
			let arr = str.split(/\s+/).slice(0, 8);
			arr[0] = (arr[0] === 'cpu') ? -1 : Number(arr[0].replace('cpu', ''));
			cpuStatArray.push(arr);
		};

		cpuStatArray.sort(this.sortFunc);

		let cpuTable = E('div', { 'class': 'table' },
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th left' }, _('CPU')),
				E('div', { 'class': 'th left' }, _('Current frequency')),
				E('div', { 'class': 'th left' }, _('Load average')),
				E('div', { 'class': 'th left' }, 'user'),
				E('div', { 'class': 'th left' }, 'nice&#160;&#160;'),
				E('div', { 'class': 'th left' }, 'system'),
				E('div', { 'class': 'th left' }, 'idle&#160;&#160;&#160;'),
				E('div', { 'class': 'th left' }, 'iowait'),
				E('div', { 'class': 'th left' }, 'irq&#160;&#160;&#160;&#160;'),
				E('div', { 'class': 'th left' }, 'softirq'),
			])
		);

		cpuStatArray.forEach((c, i) => {
			let loadUser = 0;
			let loadNice = 0;
			let loadSys = 0;
			let loadIdle = 0;
			let loadIo = 0;
			let loadIrq = 0;
			let loadSirq = 0;
			let loadAvg = 0;
			if('cpuStatusStatArray' in window) {
				let user = c[1] - window.cpuStatusStatArray[i][1];
				let nice = c[2] - window.cpuStatusStatArray[i][2];
				let sys = c[3] - window.cpuStatusStatArray[i][3];
				let idle = c[4] - window.cpuStatusStatArray[i][4];
				let io = c[5] - window.cpuStatusStatArray[i][5];
				let irq = c[6] - window.cpuStatusStatArray[i][6];
				let sirq = c[7] - window.cpuStatusStatArray[i][7];
				let sum = user + nice + sys + idle + io + irq + sirq;
				loadUser = Math.round(100 * user / sum);
				loadNice = Math.round(100 * nice / sum);
				loadSys = Math.round(100 * sys / sum);
				loadIdle = Math.round(100 * idle / sum);
				loadIo = Math.round(100 * io / sum);
				loadIrq = Math.round(100 * irq / sum);
				loadSirq = Math.round(100 * sirq / sum);
				loadAvg = Math.round(100 * (user + nice + sys + io + irq + sirq) / sum);
			};

			cpuTable.append(
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left' },
						(i === 0) ? _('All') : window.cpuStatusDevices[i - 1][0]),
					E('div', { 'class': 'td left'},
						(i === 0) ? '' : (cpuData[i] === null) ? '-' : (cpuData[i] / 1000) + ' ' + _('MHz')),
					E('div', { 'class': 'td left' },
						E('div', {
								'class': 'cbi-progressbar',
								'title': loadAvg + '%',
							},
							E('div', { 'style': 'width:' + loadAvg + '%' })
						)
					),
					E('div', { 'class': 'td left' }, loadUser + '%'),
					E('div', { 'class': 'td left' }, loadNice + '%'),
					E('div', { 'class': 'td left' }, loadSys + '%'),
					E('div', { 'class': 'td left' }, loadIdle + '%'),
					E('div', { 'class': 'td left' }, loadIo + '%'),
					E('div', { 'class': 'td left' }, loadIrq + '%'),
					E('div', { 'class': 'td left' }, loadSirq + '%'),
				])
			);
		});

		window.cpuStatusStatArray = cpuStatArray;

		return E('div', {
			'class': 'cbi-section',
		}, cpuTable);
	},
});
