import { NestedDraggable } from "@/components/ui/NestedDraggable";
import { createSignal, For } from "solid-js";
import { styled } from "solid-styled-components";

const HomePageContainer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  gap: 10px;
`;

const Item = (props: { name: string }) => {
  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        background: "red",
        "border-radius": "10px",
      }}
    >
      {props.name}
    </div>
  );
};
const HoverItem = (props: { name: string }) => {
  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        background: "green",
        "border-radius": "10px",
      }}
    >
      {props.name}
    </div>
  );
};

export default function HomePage() {
  const [items, setItems] = createSignal(
    Array.from({ length: 100 }, (_, i) => ({ name: i.toString() }))
  );

  return (
    <HomePageContainer>
      <NestedDraggable
        items={items()}
        setItems={setItems}
        hoverItem={HoverItem}
      >
        {(item) => <Item name={item.name} />}
      </NestedDraggable>
    </HomePageContainer>
  );
}
