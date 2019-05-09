import React from '@react';
import Fish from '@components/Fish/index';

import './index.scss';
class P extends React.Component {
    constructor() {
        super();
        this.state = {
            title: '',
            key: '',
            trs: [
                [{ title: 'aaa' }, { title: 'bbb' }, { title: 'ccc' }],
                [{ title: 'ddd' }, { title: 'eee' }, { title: 'fff' }],
                [{ title: 'ggg' }, { title: 'hhh' }, { title: 'iii' }],
            ],
        };
    }
    getData(item, e) {
        this.setState({
            title: item.title,
            key: e.target.dataset.key,
        });
    }

    render() {
        return (
            <div class='anu-block'>
                <div>测试循环中的事件，点击下方格子</div>
                <div>
					title:
                    {this.state.title}
                    {'  key '}
                    {this.state.key}
                </div>
                <div class="anu-block">
                    {this.state.trs.map(function(item) {
                        return (
                            <div class="anu-line" > 
                                {item.map(function(el) {
                                    return (
                                        <div class="loop2-cell" 
                                            key={el.title}
                                            onClick={ (e) => {
                                                this.getData(el, e);
                                              } }>
                                            <Fish content={el.title} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default P;
