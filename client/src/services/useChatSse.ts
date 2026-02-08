import { useEffect, useRef, useState } from "react";

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

    function onGroupMessage(
        roomId: string,
        handler: (data: any) => void
    ) {
        const eventName = `room:${roomId}`;

        const listener = (e: MessageEvent) => {
            handler(JSON.parse(e.data));
        };

        eventSourceRef.current?.addEventListener(eventName, listener);

        return () => {
            eventSourceRef.current?.removeEventListener(eventName, listener);
        };
    }

    return {
        connectionId,
        onGroupMessage,
    };
}
