import { convertFileSrc } from "@tauri-apps/api/core";
import type { ComponentProps } from "react";
import { useChatId } from "@/hooks/use-chat";

interface TauriImageSrc {
  type: "file" | "tauri" | "ref";
  value: string;
}

type TauriImageProps = Omit<ComponentProps<"img">, "src"> & { loader: TauriImageSrc };

export function TauriImage({ loader, alt, ...props }: TauriImageProps) {
  const chatId = useChatId((state) => state.id);

  let src: string;

  switch (loader.type) {
    case "file": {
      src = loader.value;
      break;
    }
    case "tauri": {
      src = `${convertFileSrc(loader.value, "image")}?type=file`;
      break;
    }
    case "ref": {
      const path = `${chatId}/${loader.value}`;
      src = `${convertFileSrc(path, "image")}?type=id`;
      break;
    }
  }

  return <img alt={alt} {...props} src={src} />;
}
