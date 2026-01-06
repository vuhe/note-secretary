import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { toast } from "sonner";

interface ToasterEvent {
  type: "info" | "warning" | "error" | "success";
  title: string;
  description?: string;
}

export function useToaster() {
  useEffect(() => {
    const unlistenPromise = listen<ToasterEvent>("toaster", (event) => {
      switch (event.payload.type) {
        case "info": {
          toast.info(event.payload.title, {
            description: event.payload.description,
            closeButton: true,
          });
          break;
        }
        case "warning": {
          toast.warning(event.payload.title, {
            description: event.payload.description,
            closeButton: true,
          });
          break;
        }
        case "error": {
          toast.error(event.payload.title, {
            description: event.payload.description,
            closeButton: true,
          });
          break;
        }
        case "success": {
          toast.success(event.payload.title, {
            description: event.payload.description,
            closeButton: true,
          });
          break;
        }
      }
    });

    return () => {
      void unlistenPromise.then((unlisten) => {
        unlisten();
      });
    };
  }, []);
}
