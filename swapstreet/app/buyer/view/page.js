"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Image
} from "lucide-react";

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

function Separator() {
  return <div className="my-5 w-full border-2 border-b-stone-400">
  </div>;
}

class ImageView extends React.Component {
  
  constructor(props) {
    super(props);
    this.urlList = props.urlList;
    this.urls = props.urlList.filter(Boolean).length; 
    this.state = {index: 0};
    this.renderer = this.urls == 1 ? this.renderSingle 
      : this.renderMultiple;
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
  
  renderSingle = () => {
    return (
      <div className="relative w-full m-4">
        {/*Assume that the image is valid*/}
        <img
          src={this.urlList[this.state.index]}
          className="absolute max-h-full inset-0 m-auto"
        />
      </div>);
  }
  
  renderMultiple = () => {
    return (<div className="h-full w-full flex flex-row">
      <ImageButton 
        icon={<ChevronLeft/>} 
        callback={this.left}
      />
        {this.renderSingle()}
      <ImageButton 
        icon={<ChevronRight/>} 
        callback={this.right}
      />
    </div>);
  }
  
  render() {
    return <div className="w-full h-full">
      <div className="flex flex-col grow h-full">
        <div className="h-full flex flex-row">
          {this.renderer()}
        </div>
        <div className="h-32 bg-stone-300">
          Footer
        </div>
      </div>
    </div>
  }
}

export default function View() {
  const [info, setInfo] = useState(null);
  
  useEffect(() => {
    
    /* There should be logic for stashing an item from the browse page
     * to debounce fetches.*/
    fetch(`http://localhost:8080/api/catalog/items/${1}`)
      .then(res => {
        var m;
        
        switch (res.status) {
          
        case 200:
          return res.json();
          
        case 500:
          m = "Server error, cannot acquire article information.";
          break;
          
        default:
          m = "Unknown item";
          break;
          
        }
        
        throw new Error(m);
      }).then(item => {
        
        /*Assume that the object defines all the item's attributes. 
        That is, none of the attributes are undefined.*/
        setInfo(<div className="flex grow h-full">
          <div className="w-3/5 bg-stone-100">
            <ImageView urlList={new Array(item.imageUrl)}/>
          </div>
          <div className="w-2/5 bg-stone-200 min-w-60">
            <div className="w-full bg-stone-200 min-w-60">
              <div className="w-full h-full p-4">
                <div className="w-full">
                  <div>
                    <div className="font-bold text-2xl">
                      {item.title}
                    </div>
                    {item.description}
                    <br/>
                    <span className="font-bold text-2xl">
                      CAD ${item.price}
                    </span>
                  </div>
                  <br/>
                  <div>
                    <span className="font-bold">
                      Condition:
                    </span>
                    {' ' + item.condition}
                  </div>
                </div>
                <Separator/>
                <div className="grid grid-cols-1 w-full">
                  
                  {/*Add links*/}
                  <Button className="my-2">Buy Now</Button>
                  <Button className="my-2">Add to Changing Room</Button>
                </div>
                <Separator/>
                <div className="">
                  Seller info
                </div>
              </div>
            </div>
          </div>
        </div>);
        
        return;
      }).catch(e => {
        setInfo(<div className="w-20 h-20 text-center content-center">
          {e.message}
        </div>);
      });
    
    return () => {};
  }, []);
  
  return <div className="h-screen w-screen">
    <div className="flex flex-col h-full w-full">
      {testNavBar}
      <div className="w-full h-full">
        {info ?? ''}
      </div>
    </div>
  </div>
}