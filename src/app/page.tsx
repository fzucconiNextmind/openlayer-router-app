import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">MAP ROUTING APP</h1>
        <Link href="/ol">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer">
            Go to OpenLayer Map
          </button>
        </Link>
        <span className="text-sm text-gray-500">
          sources:
          <br />
          <a
            className="text-blue-500"
            target="_blank"
            href="https://openlayers.org/en/latest/examples/"
          >
            OpenLayer Map
          </a>
          <br />
          <a
            className="text-blue-500"
            target="_blank"
            href="https://map.project-osrm.org/"
          >
            OSRM Map
          </a>
        </span>
      </main>
    </div>
  );
}
