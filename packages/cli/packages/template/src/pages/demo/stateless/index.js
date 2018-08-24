import React from "@react"
import Aaa from "../../../components/Aaa/index"
class P extends React.Component {
    constructor() {
        this.state = {
            a: 111
        };
    }
    changeAaa() {
        this.setState({
            a: ~~(Math.random() * 100)
        });
    }
    render() {
        return (
            <div onTap={this.changeAaa.bind(this)}>
                <Aaa aaa={this.state.a} />
            </div>
        );
    }
}

export default P;
