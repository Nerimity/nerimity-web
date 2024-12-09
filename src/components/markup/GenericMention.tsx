export function GenericMention(props: { name: string; color?: string }) {
  return (
    <div class="mention" style={{ color: props.color }}>
      @{props.name}
    </div>
  );
}
