Define input and reference as a variables

Input fasta should be named "sample_1.fasta"

Reference should be named "ref.fasta"

Create 3 rules:
1. Inputs should be Single Fasta and Reference Fasta
2. trimmomatic single end
   1. Takes "sample_1.fasta" as input
3. bowtie2 align
   1. Takes trimmomatic output as input
   2. Takes "ref.fasta" as input
4. deepvariant
   1. Takes bowtie2 align output as input

Input and outputs don't have to be actual files, but should represent the
outputs and inputs

params and threads should be defined for each rule

params should be defined as:

```
"-f -z -g"
```

threads should be defined as:

```
32
```

a wrapper directive should be specified from the
[snakemake wrapper repo](https://github.com/snakemake/snakemake-wrappers)
for each tools (like in our tools)

```
wrapper:
    "bio/bwa/mem"
```

Example rule:

```
rule mem:
    input:
        se.out,
        ref.fasta,
    output:
        mem.output,
    params:
        "-f -z -g"
    threads: 32
    wrapper:
        "bio/bwa/mem"
```

Final Snakefile made by hand should look like this:

```
rule se:
    input:
        sample_1.fasta,
    output:
        se.out,
    params:
        "-f -z -g"
    threads: 32
    wrapper:
        "bio/trimmomatic/se"

rule align:
    input:
        se.out,
        ref.fasta,
    output:
        align.out,
    params:
        "-f -z -g"
    threads: 32
    wrapper:
        "bio/bowtie2/align"

rule deepvariant:
    input:
        align.out,
    output:
        deepvariant.out,
    params:
        "-f -g -z"
    threads: 32
    wrapper:
        "bio/deepvariant"

```

We need roughly half of the individuals to use our interface first and half to
write "their own Snakefile" first.

Depending on which the user will use first, either demonstrated the Snakefile
construction by typing up the example rule, or by demoing the web page
interface. Make sure to NOT build the workflow we are askin them to build.
Instead, just show them how to add, delete, connect, drag, and search ... etc.

Users should be given the consent agreement, a photo taken if they agree, and
should be told to think aloud for both portions of the Snakefile construction.
Time to completion for both portions should be recorded as well. We will take
what the users say and attempt to create qualitative labels that we can use to
figure out if our interface is an improvement...




- Population
  - We want anyone that has some knowledge on how to use a computer and what bioinformatics is
  - Range from CISE student, to Biologist, to Bioinformatician
- Hypothesis
  - Primary: We hypothesise that the novel drag and drop interface will improve time to complete, when constructing simple Snakefiles
  - Secondary: We hypothesise that the novel drag and drop interface will be less cumbersome to use than searching through the Snakemake Wrapper Repository
- Study Conditions
  - Group A: Will do the manual construction first then use SerpenTile
  - Group B: Will use SerpenTile first and then do the manual contruction
- Participant Procedure
  - Outlined above
- Metrics
  - Time to complete (primary)
  - Speak Out Loud -> Labels (secondary)
- Pilot and Revisions
  - Do them...