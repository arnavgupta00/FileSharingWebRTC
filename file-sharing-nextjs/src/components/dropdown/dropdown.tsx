"use client";

import React, { useState, useEffect } from 'react';

import "./dropdown.css";

interface DropdownProps {
  userName: string;
}

const Dropdown: React.FC<DropdownProps> = (props) => {
  const [ authenticationCall, setauthenticationCall] = useState<boolean>(true);
  var result = props.userName;
 

  if (authenticationCall === true) {
    return (
      <div className="container" style={{zIndex:15}}>
        <button className="btn">
          <span> Hello , {result}</span>
          <ul className="dropdown">
            <li className="active"><a href="#">Profile Information</a></li>
            <li><a href="#">Help</a></li>
            <li onClick={() => { console.log("clicked logout")}}><a >Log Out</a></li>
          </ul>
        </button>
      </div>
    );
  } else {
    return (
      <div className="container" style={{zIndex:15}}>
        <button className="btn">
          <span>{"SignUp"}</span>
          <ul className="dropdown" style={{marginLeft:"-50px"}}>
            <li className="active" ><a >Login</a></li>
            <li ><a >Sign Up</a></li>
            <li><a >Help</a></li>
          </ul>
        </button>
      </div>
    );
  }
};

export default Dropdown;
