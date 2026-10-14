import { LocalStorage } from "@vicinae/api";
import type { IContainerInfo, IEndpointInfo } from "./api-types";
import { prefs } from "./prefs";

async function login(): Promise<string> {
	return fetch(`${prefs["api-url"]}/auth`, {
		method: "POST",
		body: JSON.stringify({
			Username: prefs["api-user"],
			Password: prefs["api-password"],
		}),
	})
		.then((res) => res.json())
		.then((json) => {
			LocalStorage.setItem("portainer-jwt", json.jwt);
			return json.jwt;
		})
		.catch((e) => {
			console.error(`Login failed: ${e}`);
			return false;
		});
}

async function sendAPIRequest(
	endpoint: string,
	data: RequestInit = {},
	params: URLSearchParams | undefined = undefined,
) {
	const sendRequest = (token: string) => {
		const headers = new Headers(data.headers);
		headers.set("Authorization", `Bearer ${token}`);
		return fetch(
			`${prefs["api-url"]}${endpoint}?${(params ?? new URLSearchParams()).toString()}`,
			{ ...data, headers },
		);
	};

	const token = await LocalStorage.getItem<string>("portainer-jwt");
	if (!token) await login();

	let response = await sendRequest(
		(await LocalStorage.getItem<string>("portainer-jwt")) ?? (await login()),
	);

	if (response.status === 401) {
		await login();
	}

	response = await sendRequest(
		// biome-ignore lint/style/noNonNullAssertion: Login either succeeded here or has thrown already
		(await LocalStorage.getItem<string>("portainer-jwt"))!,
	);
	if (!response.ok) throw new Error("Portainer API request failed");
	return response;
}

async function requireEndpoint(): Promise<undefined | number> {
	return (await LocalStorage.getItem("portainer-endpoint")) as
		| number
		| undefined;
}

export async function getContainers() {
	const endpointId = await requireEndpoint();
	if (!endpointId) throw new Error("No endpoint selected");
	const data = await sendAPIRequest(
		`/endpoints/${endpointId}/docker/containers/json`,
		{},
		new URLSearchParams({ all: "true" }),
	).then((res) => res.json());
	return data as IContainerInfo[];
}

export async function getEnvironments() {
	const data = await sendAPIRequest("/endpoints").then((r) => r.json());
	return data as IEndpointInfo[];
}
