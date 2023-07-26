import { onMount } from "solid-js";
import Modal from "./Modal";
import Croppie from 'croppie';
import "croppie/croppie.css"



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

  return (
    <Modal title="Crop Image" close={close} maxWidth={500}>
      <div style={{ "user-select": 'none', width: "100%", height: "400px", "margin-bottom": "50px" }}>
        <img  ref={imageEl} src={props.image} />
      </div>
      <button onclick={onClick}>test</button>
    </Modal>
  )
}