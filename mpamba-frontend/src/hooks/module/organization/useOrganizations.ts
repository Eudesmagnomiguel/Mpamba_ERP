import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/module/organization/organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto, UpdateOwnOrganizationDto } from '@/shared/dto/organization.dto';

export const useOrganizations = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['organizations', params],
		queryFn: () => organizationService.list(params),
	});
};

export const useMyOrganization = () => {
	return useQuery({
		queryKey: ['organization', 'me'],
		queryFn: () => organizationService.getMine(),
	});
};

export const useUpdateMyOrganization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateOwnOrganizationDto) => organizationService.updateMine(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['organization', 'me'] });
		},
	});
};

export const useUpdateMyOrganizationLogo = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (logo: string) => organizationService.updateMineLogo(logo),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['organization', 'me'] });
		},
	});
};

export const useOrganization = (id: string) => {
	return useQuery({
		queryKey: ['organization', id],
		queryFn: () => organizationService.getById(id),
		enabled: !!id,
	});
};

export const useCreateOrganization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateOrganizationDto) => organizationService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['organizations'] });
		},
	});
};

export const useUpdateOrganization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationDto }) =>
			organizationService.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['organizations'] });
			queryClient.invalidateQueries({ queryKey: ['organization', id] });
		},
	});
};

export const useDeleteOrganization = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => organizationService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['organizations'] });
		},
	});
};

export const useAssignModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, moduleId }: { id: string; moduleId: string }) =>
			organizationService.assignModule(id, moduleId),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['organization', id] });
		},
	});
};

export const useRemoveModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, moduleId }: { id: string; moduleId: string }) =>
			organizationService.removeModule(id, moduleId),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['organization', id] });
		},
	});
};
