import React, { Component } from "react";
import axios from "axios";
import "./css/content.css";
import eventBus from "./EventBus";
import {
    getClientID,
    getAccessToken,
    refreshToken,
    onMountCheckUrl,
} from "./provider/Oauth";

class Content extends Component {
    constructor() {
        super();

        this.tagList = {};
        this.state = {
            allButton: 1,
            authorButton: 0,
            tagButton: 0,
            tagNameButton: 1,
            problemCountButton: 0,
            tagName: "",
            hasData: 0,
            dataList: [],
            problems: [],
        };
        this.norData = [];
        this.ascDataOnCount = [];
        this.desDataOnCount = [];
        this.ascDataOnName = [];
        this.desDataOnName = [];
        this.sortIcon = {
            0: "",
            1: "up",
            2: "down",
        };
    }

    componentDidMount() {
        eventBus.on("searched", (data) =>
            this.onClickButtonShow(data.message, 0)
        );
        onMountCheckUrl();
        // axios.get('https://cors-anywhere.herokuapp.com/https://www.codechef.com/get/tags/problems')
        axios
            .get(
                "https://thingproxy.freeboard.io/fetch/https://www.codechef.com/get/tags/problems"
            )
            .then((res) => {
                console.log(res);
                this.ascDataOnCount = res.data.slice();
                this.desDataOnCount = res.data.slice();
                this.ascDataOnName = res.data.slice();
                this.desDataOnName = res.data.slice();
                this.ascDataOnCount.sort((a, b) => {
                    return a.count - b.count;
                });
                this.desDataOnCount.sort((a, b) => {
                    return b.count - a.count;
                });
                this.ascDataOnName.sort((a, b) => {
                    let fa = a.tag.toLowerCase(),
                        fb = b.tag.toLowerCase();
                    if (fa < fb) {
                        return -1;
                    }
                    if (fa > fb) {
                        return 1;
                    }
                    return 0;
                });
                this.desDataOnName.sort((a, b) => {
                    let fa = a.tag.toLowerCase(),
                        fb = b.tag.toLowerCase();
                    if (fa > fb) {
                        return -1;
                    }
                    if (fa < fb) {
                        return 1;
                    }
                    return 0;
                });
                console.log(this.ascDataOnCount);
                console.log(this.desDataOnCount);
                console.log(this.ascDataOnName);
                console.log(this.desDataOnName);
                this.setState({
                    hasData: 1,
                    dataList: this.ascDataOnName,
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

    onClickButtonShow = async (name, count) => {
        let isUnauthorised = false;
        this.setState({
            hasData: 0,
        });
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
            console.log("hello");
            isUnauthorised = true;
        }
        if (isUnauthorised) {
            let stat = await refreshToken();
            if (stat == "success") {
                isUnauthorised = false;
                this.onClickButtonShow(name, count);
            }
        }
    };

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

    authorsOnly = () => {
        return [
            this.state.dataList.map((item) => {
                if (item.tag_type == "author") return this.renderGridItem(item);
            }),
        ];
    };

    tagsOnly = () => {
        return [
            this.state.dataList.map((item) => {
                if (item.tag_type == "actual_tag")
                    return this.renderGridItem(item);
            }),
        ];
    };

    backAction = () => {
        this.setState({
            hasData: 1,
        });
        // axios.get('https://cors-anywhere.herokuapp.com/https://www.codechef.com/get/tags/problems')
        // axios
        //     .get(
        //         "https://thingproxy.freeboard.io/fetch/https://www.codechef.com/get/tags/problems"
        //     )
        //     .then((res) => {
        //         console.log(res);
        //         this.setState({
        //             hasData: 1,
        //             dataList: res.data,
        //             tag: "",
        //         });
        //     });
        this.decideDisplayFunction()();
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

    triggerAll = () => {
        this.setState({
            allButton: 1,
            authorButton: 0,
            tagButton: 0,
        });
    };

    triggerAuthors = () => {
        this.setState({
            allButton: 0,
            authorButton: 1,
            tagButton: 0,
        });
    };

    triggerTags = () => {
        this.setState({
            allButton: 0,
            authorButton: 0,
            tagButton: 1,
        });
    };

    triggerTagName = () => {
        let next = 0;
        if (this.state.tagNameButton == 0) next = 1;
        else {
            next = this.state.tagNameButton == 1 ? 2 : 1;
        }
        if (next == 1) {
            this.setState({
                tagNameButton: next,
                problemCountButton: 0,
                dataList: this.ascDataOnName,
            });
        } else {
            this.setState({
                tagNameButton: next,
                problemCountButton: 0,
                dataList: this.desDataOnName,
            });
        }
    };

    triggerProblemCount = () => {
        let next = 0;
        if (this.state.problemCountButton == 0) next = 1;
        else {
            next = this.state.problemCountButton == 1 ? 2 : 1;
        }
        if (next == 1) {
            this.setState({
                problemCountButton: next,
                tagNameButton: 0,
                dataList: this.ascDataOnCount,
            });
        } else {
            this.setState({
                problemCountButton: next,
                tagNameButton: 0,
                dataList: this.desDataOnCount,
            });
        }
    };

    tagNameBtnIconSelector = () => {
        return this.sortIcon[this.state.tagNameButton];
    };

    probCntBtnIconSelector = () => {
        return this.sortIcon[this.state.problemCountButton];
    };

    showButtons = () => {
        return [
            <div className="buttonbar">
                <div className="leftbuttons">
                    <div className="ui labeled icon buttons">
                        <button className="ui button" onClick={this.triggerAll}>
                            <i className="circle outline icon"></i>
                            ALL
                        </button>
                        <button
                            className="ui button"
                            onClick={this.triggerAuthors}
                        >
                            <i id="authordot" className="circle icon"></i>
                            AUTHORS
                        </button>
                        <button
                            className="ui button"
                            onClick={this.triggerTags}
                        >
                            <i id="tagdot" className="circle icon"></i>
                            TAGS
                        </button>
                    </div>
                </div>
                ,
                <div className="rightbuttons">
                    <div className="ui labeled icon buttons">
                        <button
                            className="ui button"
                            onClick={this.triggerTagName}
                        >
                            <i
                                className={
                                    "sort " +
                                    this.tagNameBtnIconSelector() +
                                    " icon"
                                }
                            ></i>
                            TAG NAME
                        </button>
                        <button
                            className="ui button"
                            onClick={this.triggerProblemCount}
                        >
                            <i
                                className={
                                    "sort " +
                                    this.probCntBtnIconSelector() +
                                    " icon"
                                }
                            ></i>
                            PROBLEM COUNT
                        </button>
                    </div>
                </div>
            </div>,
        ];
    };

    decideDisplayFunction = () => {
        if (this.state.allButton == 1) return this.initialContent;
        if (this.state.authorButton == 1) return this.authorsOnly;
        if (this.state.tagButton == 1) return this.tagsOnly;
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
                    <h1 id="heading">Tag categories:</h1>
                    {this.showButtons()}
                    <div className="ui grid">
                        {this.decideDisplayFunction()()}
                    </div>
                </div>
            );
        } else if (this.state.hasData == 2) {
            return <div className="resultsbg">{this.content()}</div>;
        }
    }
}

export default Content;
