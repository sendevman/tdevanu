const Timer = require('../packages/utils/timer');
const { resetNum, timerLog, errorLog, warningLog } = require('./logger/index');
const setWebView = require('../packages/utils/setWebVeiw');
const id = 'NanachiWebpackPlugin';
const { build: buildLog } = require('./logger/queue');

function showLog() {
    if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line
        console.log(buildLog.join('\n'));
    }
    const errorStack = require('./logger/queue');
    errorStack.warning.forEach(function(warning){
        warningLog(warning);
    });

    if (errorStack.error.length) {
        errorStack.error.forEach(function(error){
            errorLog(error);
        });
        process.exit(1);
    }
}

class NanachiWebpackPlugin {
    constructor({
        platform = 'wx',
        compress = false,
        beta,
        betaUi
    } = {}) {
        this.timer = new Timer();
        this.nanachiOptions = {
            platform,
            compress,
            beta,
            betaUi
        };
    }
    apply(compiler) {

        compiler.hooks.compilation.tap(id, (compilation) => {
            compilation.hooks.normalModuleLoader.tap(id, (loaderContext) => {
                loaderContext.nanachiOptions = this.nanachiOptions;
            });
        });
        
        // 删除webpack打包产物
        compiler.hooks.emit.tap(id, (compilation) => {
            delete compilation.assets[compiler.options.output.filename];
        });

        compiler.hooks.run.tapAsync(id, async (compilation, callback) => {
            this.timer.start();
            resetNum();
            callback();
        });

        compiler.hooks.watchRun.tapAsync(id, async (compilation, callback) => {
            this.timer.start();
            resetNum();
            callback();
        });
        
        compiler.hooks.done.tap(id, () => {

            this.timer.end();
            
            showLog();

            setWebView(compiler.NANACHI && compiler.NANACHI.webviews);

            timerLog(this.timer);
        });
        
    }
}

module.exports = NanachiWebpackPlugin;