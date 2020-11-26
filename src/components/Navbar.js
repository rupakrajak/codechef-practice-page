import React, { Component } from "react";
import "./css/navbar.css";
import {
    authorize,
    isAuthorized,
    unauthorize,
    getAccessToken,
} from "./provider/Oauth";
import axios from "axios";
import Content from "./Content";
import eventBus from "./EventBus";
import Autosuggest from "react-autosuggest";

class Navbar extends Component {
    constructor() {
        super();
        // this.value = "";
        this.inputRef = React.createRef();
        this.tagsAvail = false;
        this.tagList = [];
        this.tags = new Set();
        this.invalidTags = false;
        this.state = {
            signedIn: false,
            username: "",
            stars: "",
            value: "",
            suggest: 0,
            suggestions: [],
            cursor: -1,
        };
    }

    componentDidMount = () => {
        eventBus.on("authorisedChanged", (data) => this.checkAuthorized());
        eventBus.on("resultsFetched", (data) => {
            this.tagsAvail = true;
            this.tagList = data.message.data.slice();
            for (let i = 0; i < this.tagList.length; i++)
                this.tags.add(this.tagList[i].tag.toLowerCase());
            this.getSuggestions(this.state.value);
        });
    };

    handleKeyDown = (e) => {
        const _cursor = this.state.cursor;
        // arrow up/down button should select next/previous list element
        if (_cursor == -1) {
            if (e.keyCode == 40) 
                this.setState({
                    cursor: 0,
                })
            if (e.keyCode == 13) {
                this.inputRef.current.blur();
            }
        } else {
            if (e.keyCode === 38 && _cursor > 0) {
                this.setState({
                    cursor: _cursor - 1,
                });
            } else if (
                e.keyCode === 40 &&
                _cursor < this.state.suggestions.length - 1
            ) {
                this.setState({
                    cursor: _cursor + 1,
                });
            } else if (e.keyCode == 13) {
                // console.log(this.state.suggestions[_cursor])
                this.getSuggestions(this.state.suggestions[_cursor] + ",");
                this.setState({
                    value: this.state.suggestions[_cursor] + ",",
                    cursor: -1,
                })
            }
        }
    };

    _onClickSuggestion = (item) => {
        console.log(item);
    } 

    validatePrevTags = (inputs) => {
        for (let i = 0; i < inputs.length; i++)
            if (!this.tags.has(inputs[i].trim().toLowerCase()))
                this.invalidTags = true;
    };

    getSuggestions = (value) => {
        this.invalidTags = false;
        console.log("hello "+ value);
        const inputs = value.slice().split(",");
        const inputValue = inputs.pop().trim().toLowerCase();
        if (inputs.length > 0) this.validatePrevTags(inputs);
        // console.log(this.tagList);
        // console.log
        const inputLength = inputValue.length;

        let rawSuggestions = this.tagList.filter(
            (item) =>
                item.tag.toLowerCase().slice(0, inputLength) === inputValue
        );
        // console.log(rawSuggestions);
        const _suggestions = [];
        for (let i = 0; i < Math.min(7, rawSuggestions.length); i++)
            _suggestions.push(rawSuggestions[i].tag);
            
        if (inputLength != 0 && _suggestions.length === 0)
            this.invalidTags = true;
        this.setState({
            suggestions: _suggestions,
        });
            // if (inputLength === 0) {
        //     this.setState({
        //         suggest: 0,
        //     });
        // } else {
        //     this.setState({
        //         suggest: 1,
        //     });
        // }
    };

    getUserDetails = async () => {
        let URL = "https://api.codechef.com/users/me";
        let config = {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + getAccessToken(),
            },
        };
        try {
            const resp = await axios.get(URL, config);
            return resp;
        } catch (error) {
            console.log("Some error occured!");
            console.log(error);
        }
    };

    checkAuthorized = async () => {
        if (isAuthorized() != this.state.signedIn) {
            let uname = "";
            let strs = "";
            if (isAuthorized() == true) {
                let dis = await this.getUserDetails();
                console.log(dis);
                console.log(
                    dis.data.result.data.content.band +
                        " " +
                        dis.data.result.data.content.username
                );
                uname = dis.data.result.data.content.username;
                strs = dis.data.result.data.content.band;
            }
            this.setState({
                signedIn: isAuthorized(),
                username: uname,
                stars: strs,
            });
        }
    };

    onClick = async (e) => {
        e.preventDefault();
        if (this.state.signedIn == false) {
            authorize();
        } else {
            unauthorize();
        }
    };

    onSearch = (val) => {
        if (val != "") eventBus.dispatch("searched", { message: val });
    };

    displayName = () => {
        if (this.state.signedIn == true) {
            return (
                <div id="username">
                    <h1>Hello</h1>
                    <div className={"b" + this.state.stars[0]}>
                        <h1>{this.state.stars}</h1>
                    </div>
                    <div className="uname">
                        <h1>{this.state.username}</h1>
                    </div>
                </div>
            );
        } else {
            console.log("here!");
            return <div></div>;
        }
    };

    button = () => {
        let buttonText = "";
        let classname = "";
        if (this.state.signedIn == true) {
            buttonText = "Sign out";
            classname = "ui button";
        } else {
            buttonText = "Sign in";
            classname = "ui primary button";
        }
        return (
            <div id="sign">
                {this.displayName()}
                <button className={classname} onClick={this.onClick}>
                    {buttonText}
                </button>
            </div>
        );
    };

    showSuggestions = () => {
        if (!this.invalidTags) {
            return this.state.suggestions.map((item, i) => {
                return (
                    <h1
                        onMouseDown={() => this._onClickSuggestion(item)}
                        className={
                            "results" +
                            (this.state.cursor === i ? " active" : "")
                        }
                    >
                        {item}
                    </h1>
                );
            });
        } else {
            return <h1 className='invalidresults'>No suggestions found.<br />Enter a valid tag.</h1>
        }
    };

    _onFocus = () => {
        console.log("focus");
        if (this.state.suggest === 0) {
            this.setState({
                suggest: 1,
            });
        }
    };

    _onBlur = () => {
        if (this.state.suggest === 1) {
            this.setState({
                suggest: 0,
            });
        }
    };

    _onChange = (e) => {
        this.getSuggestions(e.target.value);
        // console.log("on change");
        this.setState({
            value: e.target.value,
        });
    };

    render() {
        console.log(this.state.value);
        console.log(this.state.suggestions);
        // const value = this.state.value;
        // const inputProps = {
        //     value,
        //     placeholder: "Search tags...",
        //     onChange: this.onChange,
        //     id: "searchinput",
        // };
        return (
            <div id="navbar">
                <div id="upper-panel">
                    <div id="codecheflogo">
                        <img src="https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/logo.svg"></img>
                        <inline>
                            <h1>Practice Page</h1>
                        </inline>
                    </div>
                    {this.button()}
                </div>
                <div id="lower-panel">
                    <div id="searchbar">
                        {/* <Autosuggest
                            suggestions={this.state.suggestions}
                            onSuggestionsFetchRequested={
                                this.onSuggestionsFetchRequested
                            }
                            onSuggestionsClearRequested={
                                this.onSuggestionsClearRequested
                            }
                            getSuggestionValue={this.getSuggestionValue}
                            renderSuggestion={this.renderSuggestion}
                            inputProps={inputProps}
                        /> */}
                        <input
                            ref={this.inputRef}
                            id="searchinput"
                            type="text"
                            placeholder="Search tags..."
                            autoComplete="on"
                            value={this.state.value}
                            onFocus={this._onFocus}
                            onBlur={this._onBlur}
                            onChange={this._onChange}
                            onKeyDown={this.handleKeyDown}
                        ></input>
                        <button
                            id="searchbutton"
                            onClick={() => this.onSearch(this.value)}
                        >
                            Search
                        </button>
                        <div
                            id={
                                this.state.suggest == 1
                                    ? "searchresults"
                                    : "searchresultsoff"
                            }
                        >
                            {/* <h1>hello</h1>
                            <h1>hello</h1>
                            <h1>hello</h1>
                            <h1>hello</h1>
                            <h1>hello</h1>
                            <h1>hello</h1>
                            <h1>hello</h1> */}
                            {this.showSuggestions()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Navbar;
