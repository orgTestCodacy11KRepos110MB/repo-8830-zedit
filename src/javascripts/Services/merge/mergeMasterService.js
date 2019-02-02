ngapp.service('mergeMasterService', function(progressLogger) {
    let {log, progress} = progressLogger;

    const MASTERS_PATH = 'File Header\\Master Files';

    // helper functions
    let clobberMasters = function(merge, masters) {
        merge.plugins.forEach(plugin => {
            log(`Removing master ${plugin.filename}`);
            xelib.RemoveArrayItem(masters, '', 'MAST', plugin.filename);
        });
    };

    let cleanMasters = function(merge, masters) {
        xelib.CleanMasters(merge.plugin);
        merge.plugins.forEach(plugin => {
            if (xelib.HasArrayItem(masters, '', 'MAST', plugin.filename))
                throw new Error(`Failed to remove master ${plugin.filename}, please retry the merge with a different merging method.`);
        });
    };

    let addMastersToMergedPlugin = function(merge) {
        xelib.AddAllMasters(merge.plugin);
        log(`Added masters to merged plugin`);
    };

    let addMastersToPlugins = function(merge) {
        merge.plugins.forEach(plugin => {
            xelib.AddMaster(plugin.handle, merge.filename);
        });
        log(`Added ${merge.filename} as a master to the plugins being merged`);
    };

    // public api
    this.addMasters = function(merge) {
        merge.method === 'Master' ?
            addMastersToPlugins(merge) :
            addMastersToMergedPlugin(merge);
    };

    this.removeMasters = function(merge) {
        progress('Removing masters from merge...', true);
        let masters = xelib.GetElement(merge.plugin, MASTERS_PATH);
        merge.method === 'Refactor' ?
            cleanMasters(merge, masters) :
            clobberMasters(merge, masters);
    };
});