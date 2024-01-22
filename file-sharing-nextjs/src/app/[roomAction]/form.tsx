"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import "@/app/[roomAction]/page.css";
import rn from "random-number";
import {
  setRoomNoVar,
  setFormData,
  formData,
} from "../../components/variableSet/variableSet";
import {
  handleOnJoin,
  handleOnCreate,
  socket,
  setSocket,
  socketReadyState,
} from "@/components/functions/function";
import Link from "next/link";

interface FormProps {
  actionCreate: string;
}

const Form: React.FC<FormProps> = ({ actionCreate }) => {
  const signSearchHandle = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };
  const [socketForm, setSocketForm] = useState<WebSocket>();

  const options = {
    min: 0,
    max: 9999,
    integer: true,
  };

  const numberRoom = rn(options); //rn(options)
  setFormData({ ...formData, userRoomNumber: numberRoom });

  useEffect(() => {
    console.log(
      "CALLED SETSOCKET -----------------------------------",
      socketForm
    );

    setSocketForm(setSocket()); /////////////////////////////////

    console.log(
      "CALLED SETSOCKET 224 -----------------------------------",
      socketForm
    );

  }, []);

  return (
    <div className="formBox">
      {actionCreate === "true" ? (
        <div className="formBox">
          <input
            className="signinput"
            type="text"
            name="userName"
            placeholder="Enter Full Name"
            onChange={signSearchHandle}
          />
          <input
            className="signinput"
            type="text"
            name="userEmail"
            placeholder="Enter e-mail"
            onChange={signSearchHandle}
          />
          <input
            className="signinput"
            type="text"
            name="userRoomNumber"
            placeholder="Enter Room Number"
            value={numberRoom}
            onChange={signSearchHandle}
          />
         
          {socketForm !== null ? (
            <Link href={"/callRoom"}>
              <input
                className="signSubmit"
                type="submit"
                value="Create Room"
                onClick={() => {
                  handleOnCreate(
                    socketForm ? socketForm : setSocket()
                  );
                }}
              />
            </Link>
          ) : (
            <p>Wait</p>
          )}
        </div>
      ) : (
        <div className="formBox">
          <input
            className="signinput"
            type="text"
            name="userName"
            placeholder="Enter Full Name"
            onChange={signSearchHandle}
          />
          <input
            className="signinput"
            type="text"
            name="userEmail"
            placeholder="Enter e-mail"
            onChange={signSearchHandle}
          />
          <input
            className="signinput"
            type="text"
            name="userRoomNumber"
            placeholder="Enter Room Number"
            onChange={signSearchHandle}
          />
          
          {socketForm !== null ? (
            <Link href={"/callRoom"}>
              <input
                className="signSubmit"
                type="submit"
                value="Join Room"
                onClick={() => {
                  handleOnJoin(
                    socketForm ? socketForm : setSocket()
                  );
                }}
              />
            </Link>
          ) : (
            <p>Wait</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Form;
