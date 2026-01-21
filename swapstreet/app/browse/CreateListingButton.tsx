import Link from "next/link";

export function CreateListingButton(){
  return(
    <div className="fixed bottom-4 right-4">

        <Link href="/seller/listing">
            <button className="bg-teal-400 hover:bg-teal-500 text-white font-bold w-12 h-12 rounded-full shadow-lg transition duration-150 ease-in-out">
            +
            </button>
        </Link>
    </div>
  );
}