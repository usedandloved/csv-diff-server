## helm

`helm install csv-diff-server ./charts/csv-diff-server -n csv-diff-server --dry-run`

New helm release, increase version in `charts/csv-diff-server/Chart.yaml`

`helm package charts/csv-diff-server -d packages`
`helm repo index .`
