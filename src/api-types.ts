export enum ContainerState {
	Created = "created",
	Running = "running",
	Restarting = "restarting",
	Paused = "paused",
	Exited = "exited",
	Dead = "dead",
}

export enum ContainerHealth {
	None = "none",
	Healthy = "healthy",
	Unhealthy = "unhealthy",
	Starting = "starting",
}

export interface IContainerInfo {
	Id: string;
	Names: string[];
	State: ContainerState;
	Image: string;
	Status: string;
	Command: string;
	Created: number;
	Health: { Status: string };
}

export type IAPIResponse<ContentType> = {
	responseCode: number;
	message: string;
	isError: boolean;
	// biome-ignore lint/suspicious/noConfusingVoidType: Weird type bs to account for responses with no data
	data: [ContentType] extends [void] ? undefined : ContentType;
};

export enum EnvironmentType {
	DockerLocal = 1,
	Agent = 2,
	Azure = 3,
	EdgeAgent = 4,
	KubernetesLocal = 5,
}

export enum EnvironmentStatus {
	Up = 1,
	Down = 2,
}

export interface IEndpointInfo {
	Id: number;
	Name: string;
	Type: EnvironmentType;
	ContainerEngine: string;
	GroupId: number;
	Status: EnvironmentStatus;
}
