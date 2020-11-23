import React, { Component } from "react";
import axios from "axios";
import "./css/content.css";
import configData from "./config.json";
import eventBus from "./EventBus";
import { getAccessToken, refreshToken, onMountCheckUrl } from "./provider/Oauth";

class Content extends Component {
    constructor() {
        super();
    }

    tagList = {};

    state = {
        tagName: "",
        hasData: 0,
        dataList: [],
        problems: [],
    };

    componentDidMount() {
        // console.log(process.env.REACT_APP_sample);
        eventBus.on("searched", (data) =>
            this.onClickButtonShow(data.message, 0)
        );
        onMountCheckUrl();
        // console.log(window.location);
        // let URL = 'https://api.codechef.com/tags/problems';
        // let params = {
        //     limit: 100,
        // };
        // let config = {
        //     headers: {
        //         Accept: 'application/json'

        //     }
        // }
        // axios.get('https://cors-anywhere.herokuapp.com/https://www.codechef.com/get/tags/problems')
        axios
            .get(
                "https://thingproxy.freeboard.io/fetch/https://www.codechef.com/get/tags/problems"
            )
            .then((res) => {
                console.log(res);
                this.setState({
                    hasData: 1,
                    dataList: res.data,
                });
            });
    }

    // fillTagList = () => {
    //     this.state.dataList.forEach((item) => {
    //         if (this.tagList.hasOwnProperty(item.tag)) {
    //             this.tagList[item.tag] += 1;
    //         } else {
    //             this.tagList[item.tag] = 1;;
    //         }
    //     })
    //     for (let item in this.tagList) {
    //         console.log(item + " " + this.tagList[item])
    //     }
    // }

    decideTagColor = (tag) => {
        if (this.state.tagName == tag) {
            return (
                <div
                    className="spTag"
                    onClick={() => this.onClickButtonShow(tag, 0)}
                >
                    <h1>{tag}</h1>
                </div>
            );
        } else {
            return (
                <div
                    className="tag"
                    onClick={() => this.onClickButtonShow(tag, 0)}
                >
                    <h1>{tag}</h1>
                </div>
            );
        }
    };

    renderProblems = (item) => {
        const accuracy = (item.solved / item.attempted).toFixed(2);
        return (
            <div>
                <div className="problemCard">
                    <div className="title">
                        <h1>{item.code}</h1>
                    </div>
                    <div className="details">
                        <div className="author">
                            <div className="criteria">
                                <h1>Author:</h1>
                            </div>
                            <div className="cvalue">
                                <h1>{item.author}</h1>
                            </div>
                        </div>
                        <div className="submissions">
                            <div className="criteria">
                                <h1>Submissions:</h1>
                            </div>
                            <div className="cvalue">
                                <h1>{item.solved}</h1>
                            </div>
                        </div>
                        <div className="accuracy">
                            <div className="criteria">
                                <h1>Accuracy:</h1>
                            </div>
                            <div className="cvalue">
                                <h1>{accuracy}</h1>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tags">
                    {item.tags.map((tag) => {
                        return this.decideTagColor(tag);
                    })}
                </div>
            </div>
        );
    };

    displayResults = () => {
        console.log(typeof this.state.problems);
        const items = Object.values(this.state.problems);
        return [
            items.map((item) => {
                return this.renderProblems(item);
            }),
        ];
    };

    onClickButtonShow = async(name, count) => {
        let isUnauthorised = false;
        this.setState({
            hasData: 0,
        });
        console.log(configData.Client_ID);
        let URL = "https://api.codechef.com/tags/problems";
        let config = {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + getAccessToken(),
            },
            params: {
                filter: name,
                limit: 100,
            },
        };
        try {
            let response = await axios.get(URL, config);
            console.log(response);
            if (response.status == 200) {
                console.log(response);
                this.setState({
                    tagName: name,
                    hasData: 2,
                    problems: response.data.result.data.content,
                });
                console.log(this.state.problems);
            }
        } catch (error) {
            console.log(error);
            console.log('hello');
            isUnauthorised = true;
        }
        if (isUnauthorised) {
            let stat = await refreshToken();
            if (stat == 'success') {
                isUnauthorised = false;
                this.onClickButtonShow(name, count);  
            } 
        }
    };

    // async resolveUnauthorized(name, count) {
    //     refreshToken().then((res) => {
    //         this.onClickButtonShow(name, count);
    //     });
    // }

    decideGridColor = (item) => {
        if (item.tag_type == "author") {
            return (
                <div className="aname">
                    <h1>{item.tag}</h1>
                </div>
            );
        } else {
            return (
                <div className="name">
                    <h1>{item.tag}</h1>
                </div>
            );
        }
    };

    renderGridItem = (item) => {
        return (
            <div className="four wide column">
                <div
                    className="gridContent"
                    onClick={() => this.onClickButtonShow(item.tag, item.count)}
                >
                    {this.decideGridColor(item)}
                    <div className="count">
                        <h2>x {item.count}</h2>
                    </div>
                </div>
            </div>
        );
    };

    initialContent = () => {
        return [
            this.state.dataList.map((item) => {
                return this.renderGridItem(item);
            }),
        ];
    };

    backAction = () => {
        this.setState({
            hasData: 0,
        });
        // axios.get('https://cors-anywhere.herokuapp.com/https://www.codechef.com/get/tags/problems')
        axios
            .get(
                "https://thingproxy.freeboard.io/fetch/https://www.codechef.com/get/tags/problems"
            )
            .then((res) => {
                console.log(res);
                this.setState({
                    hasData: 1,
                    dataList: res.data,
                    tag: "",
                });
            });
        this.initialContent();
    };

    content = () => {
        return [
            <div
                className="ui animated button"
                tabIndex="0"
                onClick={this.backAction}
            >
                <div className="visible content">Home</div>
                <div className="hidden content">
                    <i className="home icon"></i>
                </div>
            </div>,
            <div>{this.displayResults()}</div>,
        ];
    };

    render() {
        if (this.state.hasData == 0) {
            return (
                <div className="ui segment">
                    <div className="ui active inverted dimmer">
                        <div className="ui massive text loader">Loading...</div>
                    </div>
                </div>
            );
        } else if (this.state.hasData == 1) {
            return (
                <div className="initialContent">
                    <h1>Tag categories:</h1>
                    <div className="ui grid">{this.initialContent()}</div>
                </div>
            );
        } else if (this.state.hasData == 2) {
            return <div className="resultsbg">{this.content()}</div>;
        }
    }
}

export default Content;
