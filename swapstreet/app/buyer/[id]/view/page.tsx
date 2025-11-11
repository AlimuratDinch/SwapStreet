"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Image } from "lucide-react";

const testNavBar = (
  <div>
    <div className="h-12 bg-green-700"></div>
    <div className="h-12 bg-green-500 text-white content-center px-5">
      <div>Temporary Nav Bar</div>
    </div>
  </div>
);

function ImageButton(props) {
  return (
    <div className="flex-none content-center">
      <Button className="content-center mx-6" onClick={props.callback}>
        <div className="content-center">{props.icon}</div>
      </Button>
    </div>
  );
}

function Separator() {
  return (
    <div
      className={
        "my-5 w-full " + "border-2 border-t-white border-r-white border-l-white"
      }
    ></div>
  );
}

class ImageView extends React.Component {
  constructor(props) {
    super(props);
    this.urlList = props.urlList;
    this.urls = props.urlList.filter(Boolean).length;
    this.state = { index: 0 };
    this.renderer = this.urls == 1 ? this.renderSingle : this.renderMultiple;
    return;
  }

  // Bind `this` to `right`.
  right = () => {
    this.setState((prev) => ({
      index: (prev.index + 1) % this.urls,
    }));
    return;
  };

  // Bind `this` to `left`.
  left = () => {
    this.setState((prev) => ({
      index: (prev.index + (this.urls - 1)) % this.urls,
    }));
    return;
  };

  renderSingle = () => {
    return (
      <div className="relative w-full m-4">
        {/*Assume that the image is valid*/}
        <img
          src={this.urlList[this.state.index]}
          className="absolute max-h-full inset-0 m-auto rounded-lg"
        />
      </div>
    );
  };

  renderMultiple = () => {
    return (
      <div className="h-full w-full flex flex-row">
        <ImageButton icon={<ChevronLeft />} callback={this.left} />
        {this.renderSingle()}
        <ImageButton icon={<ChevronRight />} callback={this.right} />
      </div>
    );
  };

  render() {
    return (
      <div className="w-full h-full">
        <div className="min-h-[50vh] flex flex-col grow h-full">
          <div className="h-full flex flex-row">{this.renderer()}</div>
        </div>
      </div>
    );
  }
}

export default function View() {
  const params = useParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    /* There should be logic for stashing an item from the browse page
     * to debounce fetches.*/
    fetch(`http://localhost:8080/api/catalog/items/${params?.id}`)
      .then((res) => {
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
      })
      .then((item) => {
        /*
         * TODO: fetch users from the user database.
         */
        const tempProfile = {
          name: "Username",
          imageUrl: "/images/clothes_login_page.png",
          rating: 99.6,
        };

        function Profile(props) {
          const profile = props.profile;

          return (
            <div className="flex grow w-full h-full">
              <div className="flex w-full h-full items-center justify-between">
                <div className="flex flex-row items-center m-2">
                  <img
                    src={profile.imageUrl}
                    className="w-12 h-12 mr-4 rounded-full"
                  />
                  <div className="">
                    <span className="font-bold">{profile.name}</span>
                    <br />
                    Rating: {profile.rating}%
                  </div>
                </div>
                <Button>
                  <ChevronRight />
                </Button>
              </div>
            </div>
          );
        }

        /*Assume that the object defines all the item's attributes. 
        That is, none of the attributes are undefined.*/
        setInfo(
          <div className="flex flex-col sm:flex-row grow h-full p-2 sm:p-4">
            <div className="w-full sm:w-3/5 flex justify-center">
              <ImageView urlList={[item.imageUrl]} />
            </div>

            <div className="w-full sm:w-2/5 sm:min-w-60 m-0 sm:m-4 border-2 rounded-lg">
              <div className="p-4">
                <div>
                  <div className="font-bold text-2xl" id="itemTitle">
                    {item.title}
                  </div>
                  <p className="text-sm sm:text-base">{item.description}</p>
                  <span
                    className="font-bold text-2xl block mt-2"
                    id="itemPrice"
                  >
                    CAD ${item.price}
                  </span>
                  <div className="mt-2">
                    <span className="font-bold" id="itemCondition">
                      Condition:
                    </span>
                    {" " + item.condition}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col w-full">
                  <Button className="my-2 w-full">Buy Now</Button>
                  <Button className="my-2 w-full">Add to Changing Room</Button>
                </div>

                <Separator />

                {/* Profile */}
                <Profile profile={tempProfile} />
              </div>
            </div>
          </div>,
        );
      })
      .catch((e) => {
        setInfo(
          <div className="w-full h-full text-center content-center">
            {e.message}
          </div>,
        );
      });

    return () => {};
  }, []);

  return (
    <div className="h-screen w-full">
      <div className="flex flex-col h-full w-full bg-background">
        {testNavBar}
        <div className="w-full h-full">{info ?? ""}</div>
      </div>
    </div>
  );
}
