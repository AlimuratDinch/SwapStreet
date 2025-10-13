"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Image
} from "lucide-react";

const testItem = {
  name: "Name",
  image: ["image1", "image2", "image3"],
  condition: "brand-new",
  category: "Shirt",
  location: "Sherbrooke",
  price: "10.99 CAD",
  brand: "Addidas",
  transcription: "Made in China"
};

const testNavBar = <div>
    <div className="h-12 bg-green-700"></div>
    <div className="h-12 bg-green-500 text-white content-center px-5">
    <div>Temporary Nav Bar</div>
  </div>
</div>;

const missingImage = <div className="flex flex-row bg-stone-200  justify-center items-center h-full">
  <Image className="text-stone-400"/>
</div>

function ImageButton(icon) {
  return <div className="flex-none content-center">
    <Button className="content-center mx-6">
      <div className="content-center">
        {icon}
      </div>
    </Button>
  </div>
}

function ImageView() {
  return <div className="w-full h-full">
    <div className="flex flex-col grow h-full">
      <div className="h-full flex flex-row">
        {ImageButton(<ChevronLeft/>)}
        <div className="content-center py-20 w-full h-full">
          {missingImage}
        </div>
        {ImageButton(<ChevronRight/>)}
      </div>
      <div className="h-32 bg-stone-300">
        Footer
      </div>
    </div>
  </div>
}

export default function View() {
  
  
  return <div className="h-screen w-screen">
    <div className="flex flex-col h-full w-full">
      {testNavBar}
      <div className="flex grow">
        <div className="w-3/5 bg-stone-100">
          {ImageView()}
        </div>
        <div className="w-2/5 bg-stone-200 min-w-60">
          Properties
        </div>
      </div>
    </div>
  </div>
}