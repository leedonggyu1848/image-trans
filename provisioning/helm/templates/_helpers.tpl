{{- define "trans-image.commonLabels" -}}
helm.sh/chart: {{ printf "%s-chart-%s" .Chart.Name .Chart.Version | quote}}
app.kubernetes.io/part-of: {{ .Chart.Name | quote}}
app.kubernetes.io/name: {{ .appName | quote}}
app.kubernetes.io/version: {{ .Chart.Version | quote }}
app.kubernetes.io/managed-by: Helm
app: {{ include "trans-image.app.name" . | quote}}
{{- end -}}

{{- define "trans-image.validate.requiredApps" -}}
{{- required "values.yaml의 apps.download 섹션이 누락되었습니다." .Values.apps.download -}}
{{- required "values.yaml의 apps.upload 섹션이 누락되었습니다." .Values.apps.upload -}}
{{- required "values.yaml의 apps.transcoding 섹션이 누락되었습니다." .Values.apps.transcoding -}}
{{- end -}}

{{- define "trans-image.app.name" -}}
{{- .appName | printf "%s-app" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "trans-image.deploy.name" -}}
{{- printf "%s-deployment" (include "trans-image.app.name" .) -}}
{{- end -}}

{{- define "trans-image.service.name" -}}
{{- printf "%s-service" (include "trans-image.app.name" .) -}}
{{- end -}}

{{- define "trans-image.container.name" -}}
{{- printf "%s-container" (include "trans-image.app.name" .) -}}
{{- end -}}

{{- define "trans-image.config.name" -}}
{{- printf "%s-config" (include "trans-image.app.name" .) -}}
{{- end -}}

{{- define "trans-image-format.dburl" -}}
{{- printf "mysql://%s/%s" .url .dbname | quote -}}
{{- end -}}