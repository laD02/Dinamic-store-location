import Notification from "./Notification";

export default function Settings({ setting }: { setting: any }) {
    return (
        <>
            <Notification setting={setting} />
        </>
    );
}