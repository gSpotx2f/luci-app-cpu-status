'use strict';
'require fs';
'require rpc';

return L.Class.extend({
	title: _('CPU'),

	// Show CPU frequency. Not supported by some devices!
	showCPUFreq: true,

	callCpuStat: rpc.declare({
		object: 'luci.cpu-status',
		method: 'getCpuStat',
		expect: { '': {} }
	}),

	callCpuStatFreq: rpc.declare({
		object: 'luci.cpu-status',
		method: 'getCpuStatFreq',
		expect: { '': {} }
	}),

	load: function() {
		if(!('cpuStatusFreqSupport' in window)) {
			window.cpuStatusFreqSupport = this.showCPUFreq;
		};

		if(window.cpuStatusFreqSupport) {
			return this.callCpuStatFreq().catch(e => {});
		} else {
			return this.callCpuStat().catch(e => {});
		};
	},

	render: function(cpuData) {
		if(!cpuData) return;

		let cpuDevices = Object.keys(cpuData);

		if(cpuDevices.length === 0) return;

		cpuDevices.sort();

		// Move 'total' to the end
		cpuDevices.push(cpuDevices.shift(0));

		// Check CPU frequency support
		if(window.cpuStatusFreqSupport) {
			if(cpuData[cpuDevices[1]].freq === undefined) {
				window.cpuStatusFreqSupport = false;
			};
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

		// For single-core CPU (hide 'total')
		if(cpuDevices.length === 2) {
			cpuDevices = cpuDevices.slice(0, 1);
		};

		cpuDevices.forEach(device => {
			let loadUser	= 0;
			let loadNice	= 0;
			let loadSys		= 0;
			let loadIdle	= 0;
			let loadIowait	= 0;
			let loadIrq		= 0;
			let loadSirq	= 0;
			let loadAvg		= 0;
			if('cpuStatusStatObject' in window) {
				let user	= cpuData[device].user - window.cpuStatusStatObject[device].user;
				let nice	= cpuData[device].nice - window.cpuStatusStatObject[device].nice;
				let sys		= cpuData[device].sys - window.cpuStatusStatObject[device].sys;
				let idle	= cpuData[device].idle - window.cpuStatusStatObject[device].idle;
				let iowait	= cpuData[device].iowait - window.cpuStatusStatObject[device].iowait;
				let irq		= cpuData[device].irq - window.cpuStatusStatObject[device].irq;
				let sirq	= cpuData[device].sirq - window.cpuStatusStatObject[device].sirq;
				let sum		= user + nice + sys + idle + iowait + irq + sirq;
				loadUser 	= Number((100 * user / sum).toFixed(1));
				loadNice 	= Number((100 * nice / sum).toFixed(1));
				loadSys 	= Number((100 * sys / sum).toFixed(1));
				loadIdle 	= Number((100 * idle / sum).toFixed(1));
				loadIowait 	= Number((100 * iowait / sum).toFixed(1));
				loadIrq 	= Number((100 * irq / sum).toFixed(1));
				loadSirq 	= Number((100 * sirq / sum).toFixed(1));
				loadAvg 	= Math.round(100 * (user + nice + sys + iowait + irq + sirq) / sum);
			};

			cpuTable.append(
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'data-title': cpuTableTitles[0] },
						(device === 'cpu') ? _('All') : device.replace(/[^0-9]+/, "")),

					(window.cpuStatusFreqSupport) ?
						E('div', { 'class': 'td left', 'data-title': cpuTableTitles[1] },
							(device === 'cpu') ? '&#160;' :
								(cpuData[device].freq >= 1e6) ?
									(cpuData[device].freq / 1e6) + ' ' + _('GHz')
								:
									(cpuData[device].freq / 1e3) + ' ' + _('MHz')
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
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[7] }, loadIowait),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[8] }, loadIrq),
					E('div', { 'class': 'td center', 'data-title': cpuTableTitles[9] }, loadSirq),
				])
			);
		});

		window.cpuStatusStatObject = cpuData;
		return cpuTable;
	},
});
