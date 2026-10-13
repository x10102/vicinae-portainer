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
}

async function login() {
    fetch(`${prefs["api-url"]}/auth`, {
        "method": "POST",
        body: JSON.stringify({
            "Username": prefs["api-user"],
            "Password": prefs["api-password"]
        })
    }).then((res) => res.json())
    .then(json => LocalStorage.setItem("portainer-jwt", json['jwt']))
    .catch(e => {console.error("Login failed: " + e)})
}

export async function getContainers() {
    await login();
    const params = new URLSearchParams({all: "true"}).toString()
    let data = await fetch(`${prefs["api-url"]}/endpoints/2/docker/containers/json?${params}`, {
        headers: {
            Authorization: "Bearer " + await LocalStorage.getItem("portainer-jwt")
        }
    }
    ).then(res => res.json())
    return data as IContainerInfo[]
}