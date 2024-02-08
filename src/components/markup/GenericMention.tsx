export function GenericMention(props: { name: string }) {
  return (
    <div
      class="mention">
      @{props.name}
    </div>
  );
}