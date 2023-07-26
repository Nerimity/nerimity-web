import { onMount } from "solid-js";
import Modal from "./Modal";
import Croppie from 'croppie';
import "croppie/croppie.css"
import Button from "./Button";



export default function ImageCropModal(props: { close(): void; image: string; onCropped(points: [number, number, number]): void; }) {
  let imageEl: undefined | HTMLImageElement;
  let croppie: Croppie | undefined;

  onMount(() => {
    if (!imageEl) return;
    croppie = new Croppie(imageEl, {
      viewport: {
         type: 'circle',
         width: 300,
         height: 300,
      }
    })
  });
    
  const onClick = () => {
    const points = croppie?.get().points as unknown as string[];
    if (!points) return;
    const pointsToInt = points.map((v: string) => parseInt(v))
    props.onCropped(pointsToInt as any);   
    props.close();
  }

  const ActionButtons = (
    <Button iconName="done" label="Done" onClick={onClick} styles={{flex: 1}} primary padding={10} />
  )

  return (
    <Modal title="Crop Image" close={props.close} maxWidth={500} actionButtons={ActionButtons}>
      <div style={{ "user-select": 'none', width: "100%", height: "400px", "margin-bottom": "50px" }}>
        <img  ref={imageEl} src={props.image} />
      </div>
    </Modal>
  )
}