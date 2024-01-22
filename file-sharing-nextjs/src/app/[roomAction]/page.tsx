"use client";
import Form from "./form";
import "@/app/page.css"
import "@/app/[roomAction]/page.css";
import Navbar from "@/components/navbar/navbar";

const page = ({ params }: { params: { roomAction: string } }) => {
  const action: string = params.roomAction;

  return (
    <>
      <Navbar />
      <div id="mainLayoutDiv">
        <div id="mainLayoutDivSub1"></div>
        <div id="mainLayoutDivSub2">
          {action === "roomCreate" && <Form actionCreate="true" />}
          {action === "roomJoin" && (
            <>
              <Form actionCreate="false" />
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default page;
