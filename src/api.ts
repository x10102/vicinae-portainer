import { LocalStorage } from "@vicinae/api";
import type { IAPIResponse, IContainerInfo, IEndpointInfo } from "./api-types";
import { prefs } from "./prefs";

const trimMessage = (str: string | undefined) => {
	if (!str) return undefined;
	return str.length > 70 ? `${str.slice(0, 70)}...` : str;
};

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
		console.debug(
			`Request to ${prefs["api-url"]}${endpoint}?${(params ?? new URLSearchParams()).toString()}`,
		);
		return fetch(
			`${prefs["api-url"]}${endpoint}?${(params ?? new URLSearchParams()).toString()}`,
			{ ...data, headers },
		).catch((e) => {
			throw new Error(`API Request failed: ${e}`);
		});
	};

	const token = await LocalStorage.getItem<string>("portainer-jwt");
	if (!token) await login();

	let response = await sendRequest(
		(await LocalStorage.getItem<string>("portainer-jwt")) ?? (await login()),
	);

	if (response.status === 401) {
		await login();

		response = await sendRequest(
			// biome-ignore lint/style/noNonNullAssertion: Login either succeeded here or has thrown already
			(await LocalStorage.getItem<string>("portainer-jwt"))!,
		);
	}

	return response;
}

async function requireEndpoint(): Promise<undefined | number> {
	return (await LocalStorage.getItem("portainer-endpoint")) as
		| number
		| undefined;
}

export async function getContainers(): Promise<IAPIResponse<IContainerInfo[]>> {
	const endpointId = await requireEndpoint();
	if (!endpointId) throw new Error("No endpoint selected");
	return await sendAPIRequest(
		`/endpoints/${endpointId}/docker/containers/json`,
		{},
		new URLSearchParams({ all: "true" }),
	).then(async (res) => {
		return {
			message: "",
			isError: res.status !== 200,
			responseCode: res.status,
			data: (await res.json()) as IContainerInfo[],
		};
	});
}

export async function stopContainer(
	con: IContainerInfo,
): Promise<IAPIResponse<void>> {
	const endpointId = await requireEndpoint();
	if (!endpointId) throw new Error("No endpoint selected");
	return sendAPIRequest(
		`/endpoints/${endpointId}/docker/containers/${con.Id}/stop`,
		{ method: "POST" },
	).then(async (res) => {
		let message = "";
		const json = await res.json().catch(() => {
			return {};
		});
		switch (res.status) {
			case 204:
				message = "Container stopped";
				break;
			case 304:
				message = "Container is not running";
				break;
			case 404:
				message = "Container not found";
				break;
			case 500:
				message = "Server error";
				break;
		}

		message = trimMessage(json.message) ?? message;

		return {
			responseCode: res.status,
			isError: res.status !== 204,
			message: message,
			data: undefined,
		};
	});
}

export async function startContainer(
	con: IContainerInfo,
): Promise<IAPIResponse<void>> {
	const endpointId = await requireEndpoint();
	if (!endpointId) throw new Error("No endpoint selected");
	return sendAPIRequest(
		`/endpoints/${endpointId}/docker/containers/${con.Id}/start`,
		{ method: "POST" },
	).then(async (res) => {
		let message = "";
		const json = await res.json().catch(() => {
			return {};
		});
		switch (res.status) {
			case 204:
				message = "Container started";
				break;
			case 304:
				message = "Container is already running";
				break;
			case 400:
				message = "Invalid parameter";
				break;
			case 404:
				message = "Container not found";
				break;
			case 500:
				message = "Server error";
				break;
		}

		message = trimMessage(json.message) ?? message;

		return {
			responseCode: res.status,
			isError: res.status !== 204,
			message: message,
			data: undefined,
		};
	});
}

export async function getEnvironments(): Promise<
	IAPIResponse<IEndpointInfo[]>
> {
	return await sendAPIRequest("/endpoints").then(async (r) => {
		return {
			message: "",
			isError: false, // TODO
			responseCode: r.status,
			data: (await r.json()) as IEndpointInfo[],
		};
	});
}
