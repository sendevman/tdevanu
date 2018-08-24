import React from '@react';
import './index.less';

class P extends React.Component {
    config = {
        title: 'media'
    };

    constructor() {
        this.state = {
            state: '未开始',
            components: [
                {
                    url: '/pages/demo/media/audio/index',
                    title: 'audio'
                },
                {
                    url: '/pages/demo/media/camera/index',
                    title: 'camera'
                },
                {
                    url: '/pages/demo/media/image/index',
                    title: 'image'
                },
                {
                    url: '/pages/demo/media/video/index',
                    title: 'video'
                }
            ]
        };
    }

    render() {
        return (
            <div>
                {this.state.components.map(function(component) {
                    return (
                        <navigator
                            open-type="navigate"
                            class="item"
                            hover-class="navigator-hover"
                            url={component.url}
                        >
                            <div class="list-item">{component.title}</div>
                        </navigator>
                    );
                })}
            </div>
        );
    }
}

export default P;
