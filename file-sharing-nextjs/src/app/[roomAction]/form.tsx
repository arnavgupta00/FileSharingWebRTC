"use client";
import React, { ChangeEvent } from "react";
import "@/app/[roomAction]/page.css";
import rn from "random-number";
import {
  setRoomNoVar,
  setFormData,
  formData,
} from "../../components/variableSet/variableSet";
import { handleOnJoin, handleOnCreate } from "@/components/functions/function";
import Link from "next/link";

interface FormProps {
  actionCreate: string;
}

const Form: React.FC<FormProps> = ({ actionCreate }) => {
  const signSearchHandle = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const options = {
    min: 0,
    max: 9999,
    integer: true,
  };

  const numberRoom = rn(options); //rn(options)
  setFormData({ ...formData, userRoomNumber: numberRoom });
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
          <Link href={"/callRoom"}>
            <input
              className="signSubmit"
              type="submit"
              value="Create Room"
              onClick={handleOnCreate}
            />
          </Link>
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
          <Link href={"/callRoom"}>
            <input
              className="signSubmit"
              type="submit"
              value="Join Room"
              onClick={() => handleOnJoin()}
            />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Form;
