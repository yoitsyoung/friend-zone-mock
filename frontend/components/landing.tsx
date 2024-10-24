/**
 * v0 by Vercel.
 * @see https://v0.dev/t/oZBlwBmECM4
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";
import Image from "next/image";
import PaperPlane from "../public/paperplane.svg";
import Penguin from "../public/penguin.svg";
import SpeechBubble from "../public/speechbubble.svg";
import Cloud from "../public/cloud.svg";
import Link from "next/link";

export function Landing() {
  return (


    <div className="my-4 mx-4 bg-white flex flex-col justify-between h-auto py-4 relative max-w-[80%] max-h-[80%]" >
      <div className="flex-grow flex flex-col items-center justify-center mx-5">
      <h2 className="text-3xl sm:text-8xl font-bold text-center pt-20">
        Welcome to your <span className="text-blue-600">FriendZone</span>
      </h2>
      <div className="flex flex-col items-center space-y-2 py-5">
        <Link
          href="https://t.me/friendzone_ton_bot"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-blue-600 text-white px-10 py-4 rounded-md shadow-md hover:bg-blue-700 w-1 sm:w-auto">
            Telegram
          </Button>
        </Link>
        <div className="py-4">
          <a
            className="text-blue-600 hover:text-blue-70 whitespace-nowrap"
              href="https://docs.friendzone.cool/"
          >
            Docs
          </a>{" "}
          and{" "}
          <a
            className="text-blue-600 hover:text-blue-700 whitespace-nowrap"
              href="https://t.me/yoitsyoung"
          >
            Contact
          </a>
        </div>
        </div>
      </div>
      <div className=" absolute top-0 left-0 w-[200px] sm:w-[500px] h-auto transform -translate-y-20 -translate-x-20">
          <Image
            alt="Paper Plane"
            src={PaperPlane}

          />
        </div>
      <div className=" absolute top-4 right-0 w-[200px] sm:top-0 sm:right-0 sm:w-[400px] h-auto transform -translate-y-20 translate-x-20">
          <Image
            alt="Speech Bubble"
            src={SpeechBubble}

          />
        </div>
      <div className=" absolute top-0 right-0 w-[200px] sm:right-0 sm:w-[300px] h-auto transform -translate-y-20 translate-x-20">
          <Image alt="Cloud" src={Cloud}  />
        </div>
      <div className=" absolute bottom-0 left-0 w-[200px] sm:w-[300px] h-auto transform translate-y-20 -translate-x-20 sm:-translate-x-20 sm:translate-y-20">
          <Image
            src={Cloud}
            alt="Cloud"

          />
        </div>
      <div className=" absolute bottom-0 right-0 w-[200px] sm:w-[300px] h-auto transform translate-y-20 translate-x-20 sm:translate-x-20 sm:translate-y-20">
          <Image
            alt="Penguin"
            src={Penguin}
            style={{
              width: "auto",
              height: "auto",
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="flex  space-x-12 mb-12 relative">







          <div>

          </div>
        </div>
      </div>
    </div>

  );
}
