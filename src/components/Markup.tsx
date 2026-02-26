import "./Markup.scss";

import CodeBlock from "./markup/CodeBlock";
import Spoiler from "./markup/Spoiler";

import {
  addTextSpans,
  Entity,
  parseMarkup,
  Span,
  UnreachableCaseError
} from "@nerimity/nevula";
import { createEffect, createMemo, JSXElement, on } from "solid-js";
import {
  emojiShortcodeToUnicode,
  emojiUnicodeToShortcode,
  unicodeToTwemojiUrl
} from "@/emoji";
import { Emoji } from "./markup/Emoji";
import useChannels from "@/chat-api/store/useChannels";
import { MentionChannel } from "./markup/MentionChannel";
import useUsers from "@/chat-api/store/useUsers";
import { MentionUser } from "./markup/MentionUser";
import useMessages, { Message } from "@/chat-api/store/useMessages";
import env from "@/common/env";
import { classNames, conditionalClass } from "@/common/classNames";
import { Link } from "./markup/Link";
import {
  QuoteMessage,
  QuoteMessageHidden,
  QuoteMessageInvalid
} from "./markup/QuoteMessage";
import { GenericMention } from "./markup/GenericMention";
import { TimestampMention, TimestampType } from "./markup/TimestampMention";
import { Dynamic } from "solid-js/web";
import { Post } from "@/chat-api/store/usePosts";
import useServerRoles from "@/chat-api/store/useServerRoles";
import { WorldTimezones } from "@/common/WorldTimezones";
import Checkbox from "./ui/Checkbox";

export interface Props {
  text: string;
  inline?: boolean;
  message?: Message;
  post?: Post;
  isQuote?: boolean;
  animateEmoji?: boolean;
  class?: string;
  serverId?: string;
  prefix?: JSXElement;
  replaceCommandBotId?: boolean;
  canEditCheckboxes?: boolean;
  onCheckboxChanged?: (entity: Entity, state: boolean) => void;
}

type RenderContext = {
  props: () => Props;
  textCount: number;
  emojiCount: number;
  quoteCount: number;
};

const transformEntities = (entity: Entity, ctx: RenderContext) =>
  entity.entities.map((e) => transformEntity(e, ctx));

const sliceText = (
  ctx: RenderContext,
  span: Span,
  { countText = true } = {}
) => {
  const text = ctx.props().text.slice(span.start, span.end);
  if (countText && !/^\s+$/.test(text)) {
    ctx.textCount += text.length;
  }
  return text;
};

type CustomEntity = Entity & { type: "custom" };

const TimeOffsetRegex = /^[+-]\d{4}$/;
const CustomColorExprRegex =
  /^(?<colors>#(?:\p{Hex_Digit}{3,4}|\p{Hex_Digit}{6,7})(?:-(?:#(?:\p{Hex_Digit}{3,4}|\p{Hex_Digit}{6,7})))+)\s+(?<text>.*)$/v;

function transformCustomEntity(entity: CustomEntity, ctx: RenderContext) {
  const messages = useMessages();
  const channels = useChannels();
  const users = useUsers();
  const serverRoles = useServerRoles();
  const type = entity.params.type;
  const expr = sliceText(ctx, entity.innerSpan, { countText: false });
  switch (type) {
    case "#": {
      const channel = channels.get(expr);
      if (channel && channel.serverId) {
        ctx.textCount += expr.length;
        return <MentionChannel channel={channel} />;
      }
      break;
    }
    // Role mentions
    case "r": {
      const serverId = ctx.props().serverId;

      if (!serverId) {
        break;
      }

      const role = serverRoles.get(serverId, expr);
      if (role) {
        ctx.textCount += expr.length;
        return <GenericMention name={role.name} color={role.hexColor} />;
      }

      break;
    }
    case "@": {
      const message = ctx.props().message || ctx.props().post;
      const user =
        message?.mentions?.find((u) => u.id === expr) || users.get(expr);
      const everyoneOrSomeone = ["e", "s"].includes(expr);
      if (user) {
        ctx.textCount += expr.length;
        return <MentionUser user={user} />;
      }
      if (everyoneOrSomeone) {
        ctx.textCount += expr.length;
        return <GenericMention name={expr === "e" ? "everyone" : "someone"} />;
      }
      break;
    }
    case "q": {
      // quoted messages
      if (ctx.props().isQuote || ctx.props().inline) {
        return <QuoteMessageHidden />;
      }
      const quote = ctx
        .props()
        .message?.quotedMessages?.find((m) => m.id === expr);

      if (quote) {
        if (ctx.quoteCount >= 10) {
          break;
        }
        ctx.quoteCount += 1;
        return <QuoteMessage message={ctx.props().message} quote={quote} />;
      }

      return <QuoteMessageInvalid />;
    }
    case "ace": // legacy animated custom emoji gif
    case "wace": // animated custom emoji webp
    case "ce": {
      // custom emoji
      const [id, name] = expr.split(":");
      ctx.emojiCount += 1;
      const animated = type === "ace";
      const webpAnimated = type === "wace";
      const shouldAnimate =
        (animated || webpAnimated) && ctx.props().animateEmoji === false
          ? "?type=webp"
          : "";

      return (
        <Emoji
          custom
          clickable
          {...{
            id,
            animated: animated || webpAnimated,
            name,
            url: `${env.NERIMITY_CDN}emojis/${id}${
              animated && !webpAnimated ? ".gif" : ".webp"
            }${shouldAnimate}`
          }}
        />
      );
    }
    case "link": {
      const [url, text] = expr.split("->").map((s) => s.trim());

      if (url && text) {
        ctx.textCount += text.length;
        return <Link {...{ url, text }} />;
      }
      break;
    }
    case "to": {
      const isValidTimezone = WorldTimezones.includes(expr);
      const isValidRegex = TimeOffsetRegex.test(expr);
      if (!isValidTimezone && !isValidRegex) {
        break;
      }

      ctx.textCount += expr.length;
      return (
        <TimestampMention
          type={type as TimestampType}
          timestamp={expr}
          message={ctx.props().message}
          post={ctx.props().post}
        />
      );
    }
    case "tr": {
      const stamp = parseInt(expr);
      const date = new Date(stamp * 1000);
      if (isNaN(date as any)) {
        break;
      }
      ctx.textCount += expr.length;
      return (
        <TimestampMention
          type={type as TimestampType}
          timestamp={stamp * 1000}
          message={ctx.props().message}
          post={ctx.props().post}
        />
      );
    }
    case "ruby": {
      const output: JSXElement[] = [];
      const matches = expr.matchAll(/(.+?)\((.*?)\)/g);
      for (const match of matches) {
        const text = match[1]!.trim();
        const annotation = match[2]!.trim();

        output.push(
          <span>{text}</span>,
          <rp>(</rp>,
          <rt>{annotation}</rt>,
          <rp>)</rp>
        );
      }
      if (output.length > 0) {
        return <ruby>{output}</ruby>;
      }
      break;
    }
    case "gradient": {
      const { colors, text } =
        expr.trim().match(CustomColorExprRegex)?.groups ?? {};
      if (colors == null || text == null) break;

      return (
        <span
          class="gradient"
          style={{
            "background-image": `linear-gradient(0.25turn, ${colors.replaceAll("-", ",")})`
          }}
          textContent={text}
        />
      );
    }
    case "vertical": {
      if (!ctx.props().inline) {
        const output = expr.split("  ").join("\n").trim();

        if (output.length > 0) {
          return <div class="vertical" textContent={output} />;
        }
      }
      break;
    }
    default: {
      console.warn("Unknown custom entity:", type);
    }
  }
  return <span>{sliceText(ctx, entity.outerSpan)}</span>;
}

function transformEntity(entity: Entity, ctx: RenderContext): JSXElement {
  switch (entity.type) {
    case "text": {
      if (entity.entities.length > 0) {
        return <span>{transformEntities(entity, ctx)}</span>;
      } else {
        return <span>{sliceText(ctx, entity.innerSpan)}</span>;
      }
    }
    case "link": {
      const url = sliceText(ctx, entity.innerSpan);
      return <Link {...{ url }} />;
    }
    case "code": {
      return <code class={entity.type}>{transformEntities(entity, ctx)}</code>;
    }
    case "spoiler": {
      return <Spoiler>{transformEntities(entity, ctx)}</Spoiler>;
    }
    case "codeblock": {
      if (ctx.props().inline) {
        return <code class="code">{sliceText(ctx, entity.innerSpan)}</code>;
      }
      const lang = entity.params.lang;
      const value = sliceText(ctx, entity.innerSpan);
      return <CodeBlock value={value} lang={lang} />;
    }
    case "blockquote": {
      return (
        <blockquote classList={{ inline: ctx.props().inline }}>
          {transformEntities(entity, ctx)}
        </blockquote>
      );
    }
    case "checkbox": {
      const { checked } = entity.params;
      return (
        <Checkbox
          checked={checked}
          disabled={!ctx.props().canEditCheckboxes}
          onChange={(state) => ctx.props().onCheckboxChanged?.(entity, state)}
          style={{ display: "inline-block" }}
        />
      );
    }
    case "color": {
      const { color } = entity.params;
      const lastCount = ctx.textCount;
      let el: JSXElement;

      if (color.startsWith("#")) {
        el = <span style={{ color }}>{transformEntities(entity, ctx)}</span>;
      } else {
        el = transformEntities(entity, ctx);
      }

      if (lastCount !== ctx.textCount) {
        return el;
      } else {
        return sliceText(ctx, entity.outerSpan);
      }
    }
    case "named_link": {
      const name = entity.params.name;
      const url = entity.params.url;
      ctx.textCount += name.length;
      return <Link {...{ url, text: name }} />;
    }
    case "bold":
    case "italic":
    case "underline":
    case "strikethrough": {
      // todo: style folding when there's no before/after for dom memory usage optimization
      // if(beforeSpan.start === beforeSpan.end && afterSpan.start === afterSpan.end) {}
      return <span class={entity.type}>{transformEntities(entity, ctx)}</span>;
    }
    case "emoji_name": {
      const name = sliceText(ctx, entity.innerSpan, { countText: false });
      const unicode = emojiShortcodeToUnicode(name as unknown as string);
      if (!unicode) return sliceText(ctx, entity.outerSpan);
      ctx.emojiCount += 1;
      return <Emoji clickable name={name} url={unicodeToTwemojiUrl(unicode)} />;
    }
    case "emoji": {
      const emoji = sliceText(ctx, entity.innerSpan, { countText: false });
      ctx.emojiCount += 1;
      return (
        <Emoji
          clickable
          name={emojiUnicodeToShortcode(emoji)}
          url={unicodeToTwemojiUrl(emoji)}
        />
      );
    }
    case "heading": {
      const level = entity.params.level;
      const text = transformEntities(entity, ctx);
      ctx.textCount += text.length;
      if (ctx.props().inline) {
        return <span>{text}</span>;
      }
      return (
        <Dynamic component={`h${level}`} class="heading">
          {text}
        </Dynamic>
      );
    }
    case "custom": {
      return transformCustomEntity(entity, ctx);
    }
    default: {
      throw new UnreachableCaseError(entity);
    }
  }
}

const commandRegex = /^(\/[^:\s]*):\d+( .*)?$/m;
export function Markup(props: Props) {
  const _ctx = {
    props: () => ({
      ...props,
      text: props.replaceCommandBotId
        ? props.text.replace(commandRegex, "$1$2")
        : props.text
    }),
    emojiCount: 0,
    textCount: 0,
    quoteCount: 0
  };

  const output = createMemo(
    on(
      () => props.text,
      () => {
        const entity = addTextSpans(parseMarkup(_ctx.props().text));
        _ctx.emojiCount = 0;
        _ctx.textCount = 0;
        _ctx.quoteCount = 0;
        return transformEntity(entity, _ctx);
      }
    )
  );

  const ctx = on(output, () => _ctx);

  const largeEmoji = () =>
    !ctx().props().inline && ctx().emojiCount <= 5 && ctx().textCount === 0;

  return (
    <span
      class={classNames(
        "markup",
        props.class,
        conditionalClass(largeEmoji(), "largeEmoji")
      )}
    >
      {props.prefix}
      {output()}
    </span>
  );
}
