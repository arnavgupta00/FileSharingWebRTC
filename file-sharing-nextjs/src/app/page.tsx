"use client";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import "@/app/page.css";
export default function Home() {
  return (
    <main>
      <Navbar />
      <div id="mainLayoutDiv">
        <div id="mainLayoutDivSub1"></div>
        <div id="mainLayoutDivSub2">
          <Link
            href="/roomCreate"
            className="createRoom"
            style={{ textDecoration: "none", color: "black", scale: 0.75 }}
          >
            <p>Create Room</p>
          </Link>
          <Link
            href="/roomJoin"
            className="joinRoom"
            style={{ textDecoration: "none", color: "black", scale: 0.75 }}
          >
            <p>Join Room</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
