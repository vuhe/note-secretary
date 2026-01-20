import { convertFileSrc } from "@tauri-apps/api/core";
import type { ComponentProps } from "react";
import { useChatId } from "@/hooks/use-chat";
import type { TauriChatFileType } from "@/lib/message";

interface TauriImageSrc {
  type: TauriChatFileType;
  value: string;
}

type TauriImageProps = Omit<ComponentProps<"img">, "src"> & { loader: TauriImageSrc };

export function TauriImage({ loader, alt, ...props }: TauriImageProps) {
  const chatId = useChatId((state) => state.id);

  let src: string;

  switch (loader.type) {
    case "url": {
      src = loader.value;
      break;
    }
    case "local-path": {
      src = `${convertFileSrc(loader.value, "image")}?type=file`;
      break;
    }
    case "saved-id": {
      const path = `${chatId}/${loader.value}`;
      src = `${convertFileSrc(path, "image")}?type=id`;
      break;
    }
  }

  return <img alt={alt} {...props} src={src} />;
}
