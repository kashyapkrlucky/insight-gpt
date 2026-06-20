import Image from "next/image";

export default function NoChatMessage() {
  return (
    <div className="mx-auto grid min-h-full w-full max-w-3xl place-items-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <div className="flex justify-center">
          <Image
            alt=""
            className="object-cover rounded-full border-2 border-neutral-200"
            priority
            width={148}
            height={148}
            src="/bot.jpg"
          />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          What would you like to understand?
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Upload a pdf or select a chat to start a conversation
        </p>
      </div>
    </div>
  );
}
