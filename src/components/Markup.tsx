import './Markup.scss';

import CodeBlock from './markup/CodeBlock';
import Spoiler from './markup/Spoiler';

import {
  addTextSpans,
  Entity,
  parseMarkup,
  Span,
  UnreachableCaseError,
} from '@nerimity/nevula';
import { JSXElement, lazy } from 'solid-js';

export interface Props {
  text: string;
}

type RenderContext = {
  props: () => Props;
  textCount: number;
  emojiCount: number;
};

const transformEntities = (entity: Entity, ctx: RenderContext) =>
  entity.entities.map((e) => transformEntity(e, ctx));

const sliceText = (ctx: RenderContext, span: Span, { countText = true } = {}) => {
  const text = ctx.props().text.slice(span.start, span.end);
  if (countText && !/^\s+$/.test(text)) {
    ctx.textCount += text.length;
  }
  return text;
};

function transformEntity(entity: Entity, ctx: RenderContext) {
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
    case "code": {
      return <code class={entity.type}>{transformEntities(entity, ctx)}</code>;
    }
    case "spoiler": {
      return <Spoiler>{transformEntities(entity, ctx)}</Spoiler>
    }
    case "codeblock": {
      const lang = entity.params.lang;
      const value = sliceText(ctx, entity.innerSpan);
      return <CodeBlock value={value} lang={lang} />;
    }
    case "blockquote": {
      return <blockquote>{transformEntities(entity, ctx)}</blockquote>;
    }
    case "color": {
      const { color } = entity.params;
      const lastCount = ctx.textCount;
      let el: JSXElement;

      if (color.startsWith("#")) {
        el = <span style={{color}}>{transformEntities(entity, ctx)}</span>
      } else {
        el = transformEntities(entity, ctx);
      }
      
      if (lastCount !== ctx.textCount) {
        return el;
      } else {
        return sliceText(ctx, entity.outerSpan);
      }
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
      // this code should be unreachable
      return sliceText(ctx, entity.outerSpan);
    }
  }
}

export function Markup(props: Props) {
  const ctx = { props: () => props, emojiCount: 0, textCount: 0 };
  const entity = () => addTextSpans(parseMarkup(ctx.props().text));
  const output = () => transformEntity(entity(), ctx);

  return <span class="markup">{output}</span>;
}
