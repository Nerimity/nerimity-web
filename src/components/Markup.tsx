import './markup.css';
import {
  addTextSpans,
  Entity,
  parseMarkup,
  Span,
  UnreachableCaseError,
} from '@nerimity/nevula';

export interface Props {
  text: string;
}

type RenderContext = {
  props: Props;
  textCount: number;
  emojiCount: number;
};

const transformEntities = (entity: Entity, ctx: () => RenderContext) =>
  entity.entities.map((e) => transformEntity(e, ctx));

const sliceText = (ctx: () => any, span: Span, { countText = true } = {}) => {
  const text = ctx().props.text.slice(span.start, span.end);
  if (countText && !/^\s+$/.test(text)) {
    ctx().textCount += text.length;
  }
  return text;
};

function transformEntity(entity: Entity, ctx: () => RenderContext) {
  switch (entity.type) {
    case 'text': {
      if (entity.entities.length > 0) {
        return <span>{transformEntities(entity, ctx)}</span>;
      } else {
        return <span>{sliceText(ctx, entity.innerSpan)}</span>;
      }
    }
    case 'link': {
      const url = sliceText(ctx, entity.innerSpan);
      return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;
    }
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strikethrough': {
      // todo: style folding when there's no before/after for dom memory usage optimization
      // if(beforeSpan.start === beforeSpan.end && afterSpan.start === afterSpan.end) {}
      return <span class={entity.type}>{transformEntities(entity, ctx)}</span>;
    }

    default: {
      throw new UnreachableCaseError(entity as never);
    }
  }
}

export function Markup(props: Props) {
  const ctx = () => ({ props, emojiCount: 0, textCount: 0 });
  const entity = () => addTextSpans(parseMarkup(ctx().props.text));
  const output = () => transformEntity(entity(), ctx);

  return <span class="markup">{output}</span>;
}
