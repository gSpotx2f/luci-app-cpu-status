'use strict';
'require baseclass';
'require fs';

return baseclass.extend({
	title    : _('CPU Load'),

	statArray: null,

	load() {
		return L.resolveDefault(fs.read('/proc/stat'), null);
	},

	render(cpuData) {
		if(!cpuData) return;

		let cpuStatArray   = [];
		let statItemsArray = cpuData.trim().split('\n').filter(s => s.startsWith('cpu'));

		for(let str of statItemsArray) {
			let arr = str.split(/\s+/).slice(0, 8);
			arr[0]  = (arr[0] === 'cpu') ? Infinity : arr[0].replace('cpu', '');
			cpuStatArray.push(arr.map(e => Number(e)));
		};

		cpuStatArray.sort((a, b) => a[0] - b[0]);

		// For single-core CPU (hide 'total')
		if(cpuStatArray.length === 2) {
			cpuStatArray = cpuStatArray.slice(0, 1);
		};

		let cpuTableTitles = [
			_('CPU'),
			_('Load'),
			'user %',
			'nice %',
			'system %',
			'idle %',
			'iowait %',
			'irq %',
			'softirq %',
		];

		let cpuTable = E('table', { 'class': 'table' },
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left' }, cpuTableTitles[0]),
				E('th', { 'class': 'th left' }, cpuTableTitles[1]),
				E('th', { 'class': 'th center' }, cpuTableTitles[2]),
				E('th', { 'class': 'th center' }, cpuTableTitles[3]),
				E('th', { 'class': 'th center' }, cpuTableTitles[4]),
				E('th', { 'class': 'th center' }, cpuTableTitles[5]),
				E('th', { 'class': 'th center' }, cpuTableTitles[6]),
				E('th', { 'class': 'th center' }, cpuTableTitles[7]),
				E('th', { 'class': 'th center' }, cpuTableTitles[8]),
			])
		);

		cpuStatArray.forEach((c, i) => {
			let loadUser = 0,
			    loadNice = 0,
			    loadSys  = 0,
			    loadIdle = 0,
			    loadIo   = 0,
			    loadIrq  = 0,
			    loadSirq = 0,
			    loadAvg  = 0;
			if(this.statArray !== null) {
				let user = c[1] - this.statArray[i][1],
				    nice = c[2] - this.statArray[i][2],
				    sys  = c[3] - this.statArray[i][3],
				    idle = c[4] - this.statArray[i][4],
				    io   = c[5] - this.statArray[i][5],
				    irq  = c[6] - this.statArray[i][6],
				    sirq = c[7] - this.statArray[i][7];
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

			cpuTable.append(
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'data-title': cpuTableTitles[0] },
						(cpuStatArray[i][0] === Infinity) ? _('Total Load') : _('CPU') + ' ' + cpuStatArray[i][0]),
					E('td', { 'class': 'td left', 'data-title': cpuTableTitles[1] },
						E('div', {
								'class': 'cbi-progressbar',
								'title': (this.statArray !== null) ? loadAvg + '%' : _('Calculating') + '...',
								'style': 'min-width:8em !important',
							},
							E('div', { 'style': 'width:' + loadAvg + '%' })
						)
					),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[2] }, loadUser),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[3] }, loadNice),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[4] }, loadSys),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[5] }, loadIdle),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[6] }, loadIo),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[7] }, loadIrq),
					E('td', { 'class': 'td center', 'data-title': cpuTableTitles[8] }, loadSirq),
				])
			);
		});

		this.statArray = cpuStatArray;
		return cpuTable;
	},
});
