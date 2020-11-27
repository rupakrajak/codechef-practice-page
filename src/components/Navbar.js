import React, { Component } from "react";
import "./css/navbar.css";
import {
    authorize,
    isAuthorized,
    unauthorize,
    getAccessToken,
    onMountCheckUserStatus,
} from "./provider/Oauth";
import axios from "axios";
import Content from "./Content";
import eventBus from "./EventBus";

class Navbar extends Component {
    constructor() {
        super();

        this.state = {
            signedIn: false,
            username: "",
            stars: "",
            value: "",
            suggest: 0,
            suggestions: [],
            cursor: -1,
        };
        this.inputRef = React.createRef();
        this.tagsAvail = false;
        this.tagList = [];
        this.tags = new Set();
        this.invalidTags = false;
        this.hasLast = false;
    }

    componentDidMount = () => {
        if (onMountCheckUserStatus()) this.checkAuthorized();
        eventBus.on("authorisedChanged", (data) => this.checkAuthorized());
        eventBus.on("resultsFetched", (data) => {
            this.tagsAvail = true;
            this.tagList = data.message.data.slice();
            for (let i = 0; i < this.tagList.length; i++)
                this.tags.add(this.tagList[i].tag.toLowerCase());
            this.getSuggestions(this.state.value);
        });
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
            alert("Some error occured!");
            console.log(error);
        }
    };

    checkAuthorized = async () => {
        if (isAuthorized() != this.state.signedIn) {
            let uname = "";
            let strs = "";
            if (isAuthorized() == true) {
                let dis = await this.getUserDetails();
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
            return <div></div>;
        }
    };

    decideSearchInputColor = () => {
        if (this.state.value === "") return "searchinput";
        else {
            if (this.hasLast) return "searchinputgreen";
            else return "searchinputred";
        }
    };

    validatePrevTags = (inputs) => {
        for (let i = 0; i < inputs.length; i++)
            if (!this.tags.has(inputs[i].trim().toLowerCase()))
                this.invalidTags = true;
    };

    getSuggestions = (value) => {
        this.invalidTags = false;
        const inputs = value.slice().split(",");
        const inputValue = inputs.pop().trim().toLowerCase();
        if (inputs.length > 0) this.validatePrevTags(inputs);
        this.hasLast = this.tags.has(inputValue);
        const inputLength = inputValue.length;

        let rawSuggestions = this.tagList.filter(
            (item) =>
                item.tag.toLowerCase().slice(0, inputLength) === inputValue
        );

        const _suggestions = [];
        for (let i = 0; i < Math.min(7, rawSuggestions.length); i++)
            _suggestions.push(rawSuggestions[i].tag);

        if (inputLength != 0 && _suggestions.length === 0)
            this.invalidTags = true;
        this.setState({
            suggestions: _suggestions,
        });
    };

    showSuggestions = () => {
        if (this.tagsAvail) {
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
                return (
                    <h1 className="invalidresults">
                        No suggestions found.
                        <br />
                        Enter a valid tag.
                    </h1>
                );
            }
        } else {
            return (
                <div className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            );
        }
    };

    signInSignOutButton = () => {
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
                <button
                    className={classname}
                    onClick={this._onClickSignInSignOut}
                >
                    {buttonText}
                </button>
            </div>
        );
    };

    // event handlers
    _onClickSignInSignOut = async (e) => {
        e.preventDefault();
        if (this.state.signedIn == false) {
            authorize();
        } else {
            unauthorize();
        }
    };

    _onFocus = () => {
        if (this.state.suggest === 0) {
            this.getSuggestions(this.state.value);
            this.setState({
                suggest: 1,
            });
        }
    };

    _onBlur = () => {
        if (this.state.suggest === 1) {
            this.setState({
                cursor: -1,
                suggest: 0,
            });
        }
    };

    _onChange = (e) => {
        this.getSuggestions(e.target.value);
        this.setState({
            value: e.target.value,
        });
    };

    onSuggestionSelectionText = (suffix) => {
        let tempValue = this.state.value.trim().slice();
        let tempValueLength = tempValue.length;
        let inputs = tempValue.slice().split(",");
        let lastInputLength = inputs.pop().trim().length;
        tempValue =
            tempValue.slice(0, tempValueLength - lastInputLength) + suffix;
        return tempValue;
    };

    _onClickSuggestion = (item) => {
        let newValue = this.onSuggestionSelectionText(item);
        this.getSuggestions(newValue);
        this.setState({
            value: newValue,
        });
    };

    _onKeyDown = (e) => {
        const _cursor = this.state.cursor;
        if (_cursor == -1) {
            if (e.keyCode == 40)
                this.setState({
                    cursor: 0,
                });
            if (e.keyCode == 13 && !this.invalidTags && this.hasLast) {
                this.inputRef.current.blur();
                this._onSearch(this.state.value);
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
                let newValue = this.onSuggestionSelectionText(
                    this.state.suggestions[_cursor]
                );
                this.getSuggestions(newValue);
                this.setState({
                    value: newValue,
                    cursor: -1,
                });
            }
        }
    };

    _onSearch = (val) => {
        if (val != "" && !this.invalidTags && this.hasLast)
            eventBus.dispatch("searched", { message: val });
    };

    render() {
        return (
            <div id="navbar">
                <div id="upper-panel">
                    <div id="codecheflogo">
                        <img src="https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/logo.svg"></img>
                        <inline>
                            <h1>Practice Page</h1>
                        </inline>
                    </div>
                    {this.signInSignOutButton()}
                </div>
                <div id="lower-panel">
                    <div id="searchbar">
                        <input
                            ref={this.inputRef}
                            id={this.decideSearchInputColor()}
                            type="text"
                            placeholder="Search tags..."
                            autoComplete="on"
                            value={this.state.value}
                            onFocus={this._onFocus}
                            onBlur={this._onBlur}
                            onChange={this._onChange}
                            onKeyDown={this._onKeyDown}
                        ></input>
                        <button
                            id="searchbutton"
                            onClick={() => this._onSearch(this.state.value)}
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
                            {this.showSuggestions()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Navbar;
