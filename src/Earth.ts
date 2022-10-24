/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Transform3
{
    private earthMesh: gfx.Mesh;
    private earthMaterial: gfx.MorphMaterial;

    public globeMode: boolean;
    public naturalRotation: gfx.Quaternion;
    public mouseRotation: gfx.Quaternion;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.Mesh();
        this.earthMaterial = new gfx.MorphMaterial();

        this.globeMode = false;
        this.naturalRotation = new gfx.Quaternion();
        this.mouseRotation = new gfx.Quaternion();
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMaterial.texture = new gfx.Texture('./assets/earth-1k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMaterial.texture.setMinFilter(true, false);

        // 20x20 is reasonable for a good looking sphere
        // 150x150 is better for height mapping
        //const meshResolution = 20;     
        const meshResolution = 150;

        // A rotation about the Z axis is the earth's axial tilt
        this.naturalRotation.setRotationZ(-23.4 * Math.PI / 180); 
        
        // Precalculated vertices, normals, and triangle indices.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: number[] = [];
        const mapNormals: number[] = [];
        const texCoords: number[] = [];
        const indices: number[] = [];
        const globeMapVertices: number[] = [];
        const globeMapNormals: number[] = [];

        const increment = (Math.PI) / meshResolution;
        const numVertices = meshResolution + 1;
        const height = Math.PI/2;
        
        // As a demo, we'll add a square with 2 triangles.
        // First, we define four vertices
        /*mapVertices.push(-.5, -.5, 0);
        mapVertices.push(.5, -.5, 0);
        mapVertices.push(.5, .5, 0);
        mapVertices.push(-.5, .5, 0);*/

        //pushing v
        for(let i = 0; i < numVertices; i++){
            //vertical component
            const vertInc = height - (i * increment);
            for(let j = 0; j < numVertices; j ++){
                //idk why but multiplying by two is necessary to get map bigger
                const inc = -Math.PI + (j * (increment*2));
                //console.log(inc);
                mapVertices.push(inc, vertInc - increment, 0);
                mapVertices.push(inc, vertInc, 0);

                mapNormals.push(0, 0, 1);
                mapNormals.push(0, 0, 1);

                texCoords.push(j/numVertices, (i+1)/numVertices);
                texCoords.push(j/numVertices, i/numVertices);
            }
        }

        //use lat and long totals of a globe for i and j of for loop
        const sphereIncY = 180 / meshResolution;
        const sphereIncX = 360 / meshResolution;
        console.log(sphereIncX, sphereIncY);

        /*for(let i = 0; i < numVertices; i++){
            const vertInc = 90 - (i * sphereIncY);
            for(let j = 0; j < numVertices; j++){
                const horInc = 180 - (j * sphereIncX);
                const coords = this.convertLatLongToSphere(vertInc, horInc);
                const x = coords.x;
                const y = coords.y;
                const z = coords.z;

                globeMapVertices.push(x,y,z);
            }
        }*/
        for(let i = 90; i > -90; i-=sphereIncY){
            for(let j = 180; j > -180; j-=sphereIncX){
                const coords1 = this.convertLatLongToSphere(i, j);
                const x = coords1.x;
                const y = coords1.y;
                const z = coords1.z;

                const coords2 = this.convertLatLongToSphere(i-sphereIncY, j);
                const x2 = coords2.x;
                const y2 = coords2.y;
                const z2 = coords2.z;

                globeMapVertices.push(x,y,z);
                globeMapVertices.push(x2,y2,z2);
                globeMapNormals.push(1,1,1);
                globeMapNormals.push(1,1,1);
            }
        }


        // The normals are always directly outward towards the camera
        /*mapNormals.push(0, 0, 1);
        mapNormals.push(0, 0, 1);
        mapNormals.push(0, 0, 1);
        mapNormals.push(0, 0, 1);*/

        // Create some default texture coordinates
        /*texCoords.push(0, 0);
        texCoords.push(0, 0);
        texCoords.push(0, 0);
        texCoords.push(0, 0);*/

        // Next we define indices into the array for the two triangles
        /*indices.push(0, 1, 2);
        indices.push(0, 2, 3);*/
        let count= 0;
        for(let i = 0; i < meshResolution; i++){
            const indicesCount = (meshResolution*2 + 2) * i;
            //const angle = i * angleIncrement;
            for(let j = 0; j < meshResolution; j++){
                const num = indicesCount + (j * 2);
                indices.push(num, num + 2, num + 1);
                indices.push(num+1, num + 2, num +3);
                count = num;
            }
        }
        //console.log(count);//41 indices per row, maybe increment by 41 or 42?

        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setMorphTargetVertices(globeMapVertices);
        this.earthMesh.setMorphTargetNormals(globeMapNormals);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);
        this.earthMesh.createDefaultVertexColors();
        this.earthMesh.material = this.earthMaterial;
        this.globeMode = true;

        // Add the mesh to this group
        this.add(this.earthMesh);
    }

    // TO DO: add animations for mesh morphing
    public update(deltaTime: number) : void
    {
        // TO DO
        if(this.globeMode){
            this.earthMaterial.morphAlpha = 1;
        }
    }

    public createEarthquake(record: EarthquakeRecord, normalizedMagnitude : number)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // TO DO: currently, the earthquake is just placed randomly on the plane
        // You will need to update this code to calculate both the map and globe positions
        //const mapPosition = new gfx.Vector3(Math.random()*6-3, Math.random()*4-2, 0);
        const mapPosition = this.convertLatLongToPlane(record.latitude, record.longitude);
        const globePosition = new gfx.Vector3(Math.random()*6-3, Math.random()*4-2, 0);
        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Initially, the color is set to yellow.
        // You should update this to be more a meaningful representation of the data.
        const quakeColorNum = 1 - 2*((record.magnitude/10)%0.5);
        earthquake.material.setColor(new gfx.Color(1, quakeColorNum, 0));

        this.add(earthquake);
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Transform3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                else
                {
                    // Global adjustment to reduce the size. You should probably update this be a
                    // more meaningful representation of the earthquake's lifespan.
                    //quake.magnitue * playbacklife
                    const subtractingXY = quake.magnitude * playbackLife;
                    const subtractingZ = 0.5 * playbackLife;
                    //console.log(adjustedMag)
                    quake.scale.set(quake.magnitude - subtractingXY, quake.magnitude - subtractingXY, 0.5 - subtractingZ);
                }
            }
        });
    }

    public convertLatLongToSphere(latitude: number, longitude: number) : gfx.Vector3
    {
        // TO DO: We recommend filling in this function to put all your
        // lat,long --> plane calculations in one place.

        const latInRad = latitude * (Math.PI/180);
        const longInRad = longitude * (Math.PI/180);

        const x = Math.cos(latInRad) * Math.sin(longInRad);
        const y = Math.sin(latInRad);
        const z = Math.cos(latInRad) * Math.sin(longInRad);


        return new gfx.Vector3(x, y, z);
    }

    public convertLatLongToPlane(latitude: number, longitude: number) : gfx.Vector3
    {
        // TO DO: We recommend filling in this function to put all your
        // lat,long --> plane calculations in one place.
        const latInRad = latitude * (Math.PI/180);
        const longInRad = longitude * (Math.PI/180);


        return new gfx.Vector3(longInRad, latInRad, 0);
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMaterial.wireframe = debugMode;
    }
}