import { useCallback, useEffect, useRef, useState } from "react";

export function useChatSse(apiBaseUrl: string) {
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const es = new EventSource(`${apiBaseUrl}/Chat/Connect`);
        eventSourceRef.current = es;

        es.addEventListener("ConnectionResponse", (e) => {
            const data = JSON.parse(e.data);
            setConnectionId(data.connectionId);
        });

        return () => {
            es.close();
        };
    }, [apiBaseUrl]);

    const onGroupMessage = useCallback(
        (roomId: string, handler: (data: any) => void) => {
            const listener = (e: MessageEvent) => {
                handler(JSON.parse(e.data));
            };

            eventSourceRef.current?.addEventListener(roomId, listener);

            return () => {
                eventSourceRef.current?.removeEventListener(roomId, listener);
            };
        },
        []
    );

    const onDirectMessage = useCallback(
        (handler: (data: any) => void) => {
            const listener = (e: MessageEvent) => {
                handler(JSON.parse(e.data));
            };

            eventSourceRef.current?.addEventListener("message", listener);

            return () => {
                eventSourceRef.current?.removeEventListener("message", listener);
            };
        },
        []
    );

    return {
        connectionId,
        onGroupMessage,
        onDirectMessage,
    };
}
