'use strict';
'require fs';

return L.Class.extend({
	title: _('CPU'),

	// Show CPU frequency. Not supported by some devices!
	showCPUFreq: true,

	deviceRegExp: new RegExp('^cpu[0-9]+$'),

	sortFunc: function(a, b) {
		return a[0] - b[0];
	},

	load: async function() {
		if(!('cpuStatusDevices' in window)) {
			// This code is executed only once (during the loading of the status page)

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

			window.cpuStatusFreqSupport = this.showCPUFreq;
		};

		let promises = [];

		if(window.cpuStatusDevices.length > 0) {
			promises.push(L.resolveDefault(fs.read('/proc/stat'), null));

			if(window.cpuStatusFreqSupport) {
				for(let cpu of window.cpuStatusDevices) {
					promises.push(
						fs.trimmed(cpu[1] + '/cpufreq/cpuinfo_cur_freq')
					)
				};
			};
		};

		return Promise.all(promises).catch(e => {});
	},

	render: function(cpuData) {
		if(!cpuData || !cpuData[0]) return;

		let cpuStatArray = [];
		let statStringsArray = cpuData[0].trim().split('\n').filter(s => s.startsWith('cpu'));

		for(let str of statStringsArray) {
			let arr = str.split(/\s+/).slice(0, 8);
			arr[0] = (arr[0] === 'cpu') ? Infinity : arr[0].replace('cpu', '');
			cpuStatArray.push(arr.map(e => Number(e)));
		};

		cpuStatArray.sort(this.sortFunc);

		// Check CPU frequency support
		if(window.cpuStatusFreqSupport) {
			cpuData.forEach(freqVal => {
				if(!freqVal) {
					window.cpuStatusFreqSupport = false;
				};
			});
		};

		let cpuTableTitles = [
			'#',
			_('Current frequency'),
			_('Load'),
			'user %',
			'nice %',
			'system %',
			'idle %',
			'iowait %',
			'irq %',
			'softirq %',
		];

		let cpuTable = E('div', { 'class': 'table' },
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th left' }, cpuTableTitles[0]),

				(window.cpuStatusFreqSupport) ?
						E('div', { 'class': 'th left' }, cpuTableTitles[1]) : '',

				E('div', { 'class': 'th left' }, cpuTableTitles[2]),
				E('div', { 'class': 'th center' }, cpuTableTitles[3]),
				E('div', { 'class': 'th center' }, cpuTableTitles[4]),
				E('div', { 'class': 'th center' }, cpuTableTitles[5]),
				E('div', { 'class': 'th center' }, cpuTableTitles[6]),
				E('div', { 'class': 'th center' }, cpuTableTitles[7]),
				E('div', { 'class': 'th center' }, cpuTableTitles[8]),
				E('div', { 'class': 'th center' }, cpuTableTitles[9]),
			])
		);

		// For single-core CPU (hide total)
		if(cpuStatArray.length === 2) {
			cpuStatArray = cpuStatArray.slice(0, 1);
		};

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
				loadUser = Number((100 * user / sum).toFixed(1));
				loadNice = Number((100 * nice / sum).toFixed(1));
				loadSys = Number((100 * sys / sum).toFixed(1));
				loadIdle = Number((100 * idle / sum).toFixed(1));
				loadIo = Number((100 * io / sum).toFixed(1));
				loadIrq = Number((100 * irq / sum).toFixed(1));
				loadSirq = Number((100 * sirq / sum).toFixed(1));
				loadAvg = Math.round(100 * (user + nice + sys + io + irq + sirq) / sum);
			};

			cpuTable.append(
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'data-title': cpuTableTitles[0] },
						(cpuStatArray[i][0] === Infinity) ? _('All') : window.cpuStatusDevices[i][0]),

					(window.cpuStatusFreqSupport) ?
						E('div', { 'class': 'td left', 'data-title': cpuTableTitles[1] },
							(cpuStatArray[i][0] === Infinity) ? '&#160;' :
								(cpuData[i + 1] >= 1e6) ?
									(cpuData[i + 1] / 1e6) + ' ' + _('GHz')
								:
									(cpuData[i + 1] / 1e3) + ' ' + _('MHz')
						)
					: '',

					E('div', { 'class': 'td left', 'data-title': cpuTableTitles[2] },
						E('div', {
								'class': 'cbi-progressbar',
								'title': loadAvg + '%',
								'style': 'min-width:8em !important',
							},
							E('div', { 'style': 'width:' + loadAvg + '%' })
						)
					),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[3] }, loadUser),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[4] }, loadNice),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[5] }, loadSys),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[6] }, loadIdle),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[7] }, loadIo),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[8] }, loadIrq),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[9] }, loadSirq),
				])
			);
		});

		window.cpuStatusStatArray = cpuStatArray;

		return cpuTable;
	},
});
