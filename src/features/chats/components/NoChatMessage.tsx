import Image from "next/image";

export default function NoChatMessage() {
  return (
    <div className="mx-auto grid min-h-full w-full max-w-3xl place-items-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <div className="flex justify-center">
          <Image
            alt=""
            className="rounded-md border border-neutral-200 object-cover shadow-sm"
            priority
            width={112}
            height={112}
            src="/bot.jpg"
          />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-neutral-950">
          What would you like to understand?
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Upload a PDF or select a recent chat to begin.
        </p>
      </div>
    </div>
  );
}
