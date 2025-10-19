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
  image: [
    "https://picsum.photos/id/233/800/500", 
    "https://picsum.photos/id/21/600/1700", 
    "https://picsum.photos/id/125/1300/700"
  ],
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

function ImageButton(props) {
  return <div className="flex-none content-center">
    <Button 
      className="content-center mx-6"
      onClick={props.callback}
    >
      <div className="content-center">
        {props.icon}
      </div>
    </Button>
  </div>
}

class ImageView extends React.Component {
  
  constructor(props) {
    super(props);
    this.urlList = props.urlList;
    this.urls = props.urlList.filter(Boolean).length; 
    this.state = {index: 0};
    return;
  }
  
  // Bind `this` to `right`.
  right = () => {
    this.setState((prev) => ({
      index: (prev.index+1) % this.urls
    }));
    return;
  }
  
  // Bind `this` to `left`.
  left = () => {
    this.setState((prev) => ({
      index: (prev.index+(this.urls-1)) % this.urls
    }));
    return;
  }
  
  render() {
    return <div className="w-full h-full">
      <div className="flex flex-col grow h-full">
        <div className="h-full flex flex-row">
          <ImageButton 
            icon={<ChevronLeft/>} 
            callback={this.left}
          />
          <div className="relative w-full h-full">
            {/*Assume that the image is valid*/}
            <img
              src={this.urlList[this.state.index]}
              className="absolute max-h-full inset-0 m-auto"
            />
          </div>
          <ImageButton 
            icon={<ChevronRight/>} 
            callback={this.right}
          />
        </div>
        <div className="h-32 bg-stone-300">
          Footer
        </div>
      </div>
    </div>
  }
}

export default function View() {
  return <div className="h-screen w-screen">
    <div className="flex flex-col h-full w-full">
      {testNavBar}
      <div className="flex grow">
        <div className="w-3/5 bg-stone-100">
          <ImageView urlList={testItem.image}/>
        </div>
        <div className="w-2/5 bg-stone-200 min-w-60">
          Properties
        </div>
      </div>
    </div>
  </div>
}