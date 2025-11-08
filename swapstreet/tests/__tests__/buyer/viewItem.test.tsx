import { render, screen } from "@testing-library/react";
import React from "react";
import Enzyme, {mount} from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import View from "@/app/buyer/[id]/view";

Enzyme.configure({adapter: new Adapter()});

describe("Users", () => {
  let wrapper, data;
  
  beforeEach(() => {
    const mockData = {
      imageUrl: "test-url",
      title: "White Shirt",
      description: "quality material",
      price: 9.99,
      condition: "Good",
    };
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      json: async () => mockData
    }));
    wrapper = mount(<View />);
  });
  
  it("displays item information", async () => {
    await act(() => new Promise(setImmediate));
    wrapper.update();
    const title = wrapper.findById("itemTitle");
    
    expect(title.exists()).toBe(true);
    expect(title.text()).toEqual("White Shirt");
  });
});