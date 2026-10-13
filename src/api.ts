import { prefs } from "./prefs";
import { LocalStorage } from "@vicinae/api";

export enum ContainerState {
    Created = "created",
    Running = "running",
    Restarting = "restarting",
    Paused = "paused",
    Exited = "exited",
    Dead = "dead"
}

export interface IContainerInfo {
    Id: string
    Names: string[]
    State: ContainerState
    Image: string
    Status: string
}

async function login() : Promise<string> {
    return fetch(`${prefs["api-url"]}/auth`, {
        "method": "POST",
        body: JSON.stringify({
            "Username": prefs["api-user"],
            "Password": prefs["api-password"]
        })
    }).then((res) => res.json())
    .then(json => {LocalStorage.setItem("portainer-jwt", json['jwt']); return json['jwt'];})
    .catch(e => {console.error("Login failed: " + e); return false;})
}

async function sendAPIRequest(endpoint: string, data: RequestInit, params: URLSearchParams | undefined) {
    const sendRequest = (token: string) => {
        const headers = new Headers(data.headers);
        headers.set("Authorization", "Bearer " + token);
        return fetch(`${prefs["api-url"]}${endpoint}?${(params ?? new URLSearchParams).toString()}`, {...data, headers})
    }

    const token = await LocalStorage.getItem<string>("portainer-jwt");
    if(!token) await login();

    let response = await sendRequest(await LocalStorage.getItem<string>("portainer-jwt") ?? await login());

    if(response.status == 401) {
        await login();
    }

    response = await sendRequest((await LocalStorage.getItem<string>("portainer-jwt"))!);
    if(!response.ok) throw new Error("Portainer API request failed")
    return response;
}

export async function getContainers() {
    const data = await sendAPIRequest('/endpoints/2/docker/containers/json', {}, new URLSearchParams({all: "true"}))
    .then(res => res.json())
    return data as IContainerInfo[]
}