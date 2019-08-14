import React from '@react';
import { Provider } from 'mobx-react';
import Store from './store/index';
import './pages/index/index';

React.Provider = Provider;
const store = new Store();

class Global extends React.Component {
    globalData = {}
    static config = {
        window: {
            navigationBarBackgroundColor: '#00afc7',
            backgroundTextStyle: 'light',
            backgroundColor: '#00afc7',
            navigationBarTitleText: 'nanachi',
            navigationBarTextStyle: 'white'
        }
    };
    onLaunch() {
        //针对快应用的全局getApp补丁
        if (this.$data && typeof global === 'object') {
            var ref = Object.getPrototypeOf(global) || global;
            var _this = this;
            this.globalData = this.$def.globalData;
            ref.getApp = function() {
                return _this;
            };
        }
        console.log('App launched');//eslint-disable-line
    }
    render() {
        return <React.Provider store={store}>{this.props.children}</React.Provider>
    }
}
React.registerAppRender(Global);
// eslint-disable-next-line
export default App(new Global());
